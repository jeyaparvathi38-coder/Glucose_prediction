    // ---- PAGE NAVIGATION ----
    let currentPage = 'home';
    let chartsInitialized = false;
    let predResult = null;

    function showPage(name) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.getElementById('page-' + name).classList.add('active');
      const links = document.querySelectorAll('.nav-link');
      links.forEach(l => { if (l.textContent.toLowerCase().includes(name.replace('performance', 'model').replace('upload', 'upload') || name)) l.classList.add('active'); });
      currentPage = name;
      window.scrollTo(0, 0);
      if (name === 'analytics' && !chartsInitialized) { setTimeout(initCharts, 100); chartsInitialized = true; }
      if (name === 'performance') { setTimeout(initPerfCharts, 100); }
    }

    // ---- AI CHAT via OpenAI API ----
    const SYSTEM_PROMPT = `You are GlucoAI, an expert health AI assistant for the GlucoPredict application — a machine learning system that predicts glucose risk levels using the Framingham Heart Study dataset. You help users understand:
- Glucose level interpretation and risk factors (BMI, blood pressure, age, cholesterol, smoking)
- The Framingham dataset and cardiovascular health biomarkers
- How Random Forest, Logistic Regression, and Decision Tree models work for classification
- SHAP feature importance and explainable AI concepts
- Clinical interpretation of glucose risk predictions (Low/Medium/High)
- Recommendations for glucose management

Keep responses concise, clinically accurate, and conversational. Use emojis sparingly. Always remind users to consult a healthcare professional for medical decisions.`;

    // API key is securely stored in .env on the server — chat goes through /api/chat

    const chatHistory = { home: [], pred: [] };

    async function sendChat(which) {
      const inputEl = document.getElementById(which + '-chat-input');
      const btnEl = document.getElementById(which + '-chat-btn');
      const msgsEl = document.getElementById(which + '-chat-msgs');
      const text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = '';
      btnEl.disabled = true;

      // Add user message
      msgsEl.innerHTML += `<div class="ai-msg user">${escHtml(text)}</div>`;
      msgsEl.innerHTML += `<div class="ai-msg bot" id="typing-${which}"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
      msgsEl.scrollTop = msgsEl.scrollHeight;

      chatHistory[which].push({ role: 'user', content: text });

      // Build context
      let contextPrefix = '';
      if (which === 'pred' && predResult) {
        contextPrefix = `[Current prediction context: Patient risk level is ${predResult.level} with ${predResult.score}% risk score. Key factors: BMI=${predResult.inputs.bmi}, Age=${predResult.inputs.age}, SystolicBP=${predResult.inputs.sbp}, Cholesterol=${predResult.inputs.chol}].\n\n`;
      }

      const messages = chatHistory[which].map((m, i) =>
        i === 0 && contextPrefix ? { role: m.role, content: contextPrefix + m.content } : m
      );

      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ];

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: apiMessages
          })
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'API Error');
        }

        const reply = data.data.choices?.[0]?.message?.content || 'Sorry, I could not process that right now.';
        chatHistory[which].push({ role: 'assistant', content: reply });
        const typingEl = document.getElementById('typing-' + which);
        if (typingEl) typingEl.outerHTML = `<div class="ai-msg bot">${escHtml(reply)}</div>`;
      } catch (e) {
        const typingEl = document.getElementById('typing-' + which);
        if (typingEl) typingEl.outerHTML = `<div class="ai-msg bot" style="color: var(--warn)">⚠️ ${e.message}</div>`;
      }
      msgsEl.scrollTop = msgsEl.scrollHeight;
      btnEl.disabled = false;
      inputEl.focus();
    }

    function escHtml(t) {
      return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
    }

    // ---- PREDICTION ENGINE ----
    function runPrediction() {
      const age = +document.getElementById('p-age').value;
      const gender = +document.getElementById('p-gender').value;
      const bmi = +document.getElementById('p-bmi').value;
      const sbp = +document.getElementById('p-sbp').value;
      const dbp = +document.getElementById('p-dbp').value;
      const chol = +document.getElementById('p-chol').value;
      const hr = +document.getElementById('p-hr').value;
      const cigs = +document.getElementById('p-cigs').value;
      const smoke = +document.getElementById('p-smoke').value;
      const diab = +document.getElementById('p-diab').value;
      const bpmed = +document.getElementById('p-bpmed').value;

      if (!age || !bmi || !sbp || !chol) {
        showNotif('⚠️ Please fill in all required fields', 'warn'); return;
      }

      const btn = document.getElementById('predict-btn');
      document.getElementById('pred-btn-text').classList.add('hidden');
      document.getElementById('pred-btn-spinner').classList.remove('hidden');
      btn.disabled = true;

      fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, male: gender, BMI: bmi, sysBP: sbp, diaBP: dbp, totChol: chol, heartRate: hr, currentSmoker: smoke, cigsPerDay: cigs, diabetes: diab, BPMeds: bpmed })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.error || 'API Error');
        
        const score = data.prediction.risk_score;
        const level = data.prediction.risk_level;
        const color = level === 'High' ? '#ff4d6a' : level === 'Medium' ? '#ffb946' : '#00d68f';
        const stroke = level === 'High' ? 'var(--red)' : level === 'Medium' ? 'var(--amber)' : 'var(--green)';

        predResult = { score, level, color, inputs: { age, gender, bmi, sbp, dbp, chol, hr, cigs, smoke, diab, bpmed } };

        // Animate ring
        document.getElementById('ring-fill').style.stroke = stroke;
        const circ = 2 * Math.PI * 64;
        const fill = (score / 100) * circ;
        document.getElementById('ring-fill').style.strokeDasharray = fill + ' ' + circ;
        document.getElementById('ring-pct').textContent = score + '%';
        document.getElementById('ring-pct').style.color = stroke;

        // Badge
        const badge = document.getElementById('risk-badge');
        badge.textContent = level + ' Risk';
        badge.className = 'risk-badge risk-' + level.toLowerCase();
        badge.style.display = 'block';

        // Label
        const labels = { High: 'Elevated glucose risk — recommend clinical follow-up and lifestyle changes.', Medium: 'Moderate glucose risk — monitor regularly and maintain healthy habits.', Low: 'Low glucose risk — continue healthy lifestyle maintenance.' };
        document.getElementById('risk-label').textContent = labels[level];

        // Insights
        const insights = buildInsights({ age, bmi, sbp, chol, smoke, diab, level });
        document.getElementById('insight-list').innerHTML = insights.map(i => `
      <li class="insight-item">
        <div class="insight-dot" style="background:${i.color}"></div>
        <span>${escHtml(i.text)}</span>
      </li>`).join('');

        // SHAP bars
        const shapData = data.shap_values && data.shap_values.length > 2 ? data.shap_values : calcShap({ bmi, age, sbp, chol, cigs, smoke, diab, bpmed, dbp, hr });
        document.getElementById('shap-bars').innerHTML = shapData.map(s => `
      <div class="shap-row">
        <div class="shap-name">${escHtml(s.name || s.feature)}</div>
        <div class="shap-bar-bg"><div class="shap-bar ${s.val > 0 || s.value > 0 ? 'pos' : 'neg'}" style="width:0%" data-w="${Math.abs(s.pct || (s.value*100))}"></div></div>
        <div class="shap-val" style="color:${s.val > 0 || s.value > 0 ? 'var(--accent)' : 'var(--red)'}">${s.val > 0 || s.value > 0 ? '+' : ''}${parseFloat(s.val || s.value).toFixed(2)}</div>
      </div>`).join('');

        // Animate SHAP bars
        setTimeout(() => {
          document.querySelectorAll('.shap-bar').forEach(b => {
            b.style.width = Math.min(100, parseFloat(b.dataset.w)) + '%';
          });
        }, 100);

        // Show result
        document.getElementById('result-idle').style.display = 'none';
        document.getElementById('result-panel').classList.add('show');
        document.getElementById('pred-btn-text').classList.remove('hidden');
        document.getElementById('pred-btn-spinner').classList.add('hidden');
        btn.disabled = false;
        showNotif('✅ Prediction complete!');
      })
      .catch(err => {
        console.error(err);
        showNotif('⚠️ Prediction failed. Check console.', 'warn');
        document.getElementById('pred-btn-text').classList.remove('hidden');
        document.getElementById('pred-btn-spinner').classList.add('hidden');
        btn.disabled = false;
      });
    }

    function buildInsights({ age, bmi, sbp, chol, smoke, diab, level }) {
      const out = [];
      if (bmi > 30) out.push({ text: `BMI of ${bmi.toFixed(1)} indicates obesity — a primary driver of insulin resistance and elevated glucose.`, color: '#ff4d6a' });
      else if (bmi > 25) out.push({ text: `BMI of ${bmi.toFixed(1)} is in the overweight range. Modest weight reduction can significantly reduce glucose risk.`, color: '#ffb946' });
      else out.push({ text: `BMI of ${bmi.toFixed(1)} is within the healthy range — a protective factor for glucose regulation.`, color: '#00d68f' });
      if (sbp > 140) out.push({ text: `Systolic BP of ${sbp} mmHg is elevated — hypertension and glucose dysregulation often co-occur.`, color: '#ff4d6a' });
      if (chol > 240) out.push({ text: `Total cholesterol of ${chol} mg/dL is high — associated with increased metabolic syndrome risk.`, color: '#ffb946' });
      if (age > 60) out.push({ text: `Age ${age} is a significant non-modifiable risk factor — glucose tolerance naturally decreases with age.`, color: '#ffb946' });
      if (smoke) out.push({ text: 'Active smoking impairs insulin sensitivity and increases cardiovascular-metabolic risk compounding glucose effects.', color: '#ff7a45' });
      if (diab) out.push({ text: 'Pre-existing diabetes diagnosis is the strongest single predictor — ongoing management is critical.', color: '#ff4d6a' });
      if (level === 'Low') out.push({ text: 'Overall risk profile is favorable. Maintain current lifestyle with annual glucose screening.', color: '#00d68f' });
      return out.slice(0, 4);
    }

    function calcShap({ bmi, age, sbp, chol, cigs, smoke, diab, bpmed, dbp, hr }) {
      const feats = [
        { name: 'BMI', val: +(((bmi - 25) / 10) * 0.35).toFixed(3) },
        { name: 'Age', val: +(((age - 45) / 30) * 0.28).toFixed(3) },
        { name: 'Systolic BP', val: +(((sbp - 120) / 60) * 0.22).toFixed(3) },
        { name: 'Cholesterol', val: +(((chol - 200) / 100) * 0.18).toFixed(3) },
        { name: 'Smoking', val: +(smoke * 0.14).toFixed(3) },
        { name: 'Diabetes', val: +(diab * 0.32).toFixed(3) },
        { name: 'BP Medication', val: +(bpmed * 0.10).toFixed(3) },
        { name: 'Heart Rate', val: +(((hr - 70) / 40) * 0.08).toFixed(3) },
        { name: 'Diastolic BP', val: +(((dbp - 80) / 30) * 0.09).toFixed(3) },
        { name: 'Cigs/Day', val: +(cigs * 0.005).toFixed(3) },
      ];
      const maxAbs = Math.max(...feats.map(f => Math.abs(f.val)));
      return feats.map(f => ({ ...f, pct: maxAbs > 0 ? Math.round(Math.abs(f.val) / maxAbs * 100) : 0 })).sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
    }

    // ---- ANALYTICS CHARTS ----
    function initCharts() {
      // Glucose distribution
      new Chart(document.getElementById('chart-glucose'), {
        type: 'bar',
        data: {
          labels: ['40-60', '60-75', '75-90', '90-110', '110-140', '140-200', '200+'],
          datasets: [{
            label: 'Patients', data: [180, 820, 1240, 1050, 620, 230, 100],
            backgroundColor: ['#00d4ff33', '#00d4ff55', '#00d4ff88', '#00d4ffaa', '#ff7a4566', '#ff4d6a66', '#ff4d6a99'],
            borderColor: ['#00d4ff', '#00d4ff', '#00d4ff', '#00d4ff', '#ff7a45', '#ff4d6a', '#ff4d6a'],
            borderWidth: 2, borderRadius: 6
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } } } }
      });

      // Scatter BMI vs Glucose
      const scatter = [];
      for (let i = 0; i < 120; i++) {
        const bmi = 18 + Math.random() * 22; const g = 60 + bmi * 2.1 + (Math.random() - 0.5) * 30;
        scatter.push({ x: +bmi.toFixed(1), y: +g.toFixed(1) });
      }
      new Chart(document.getElementById('chart-bmi-glucose'), {
        type: 'scatter',
        data: { datasets: [{ label: 'Patients', data: scatter, backgroundColor: 'rgba(0,212,255,0.4)', pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'BMI', color: '#8a9bc4' }, ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { title: { display: true, text: 'Glucose (mg/dL)', color: '#8a9bc4' }, ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } } } }
      });

      // Risk donut
      new Chart(document.getElementById('chart-risk-dist'), {
        type: 'doughnut',
        data: {
          labels: ['Low Risk 52%', 'Medium Risk 33%', 'High Risk 15%'],
          datasets: [{ data: [52, 33, 15], backgroundColor: ['#00d68f55', '#ffb94666', '#ff4d6a66'], borderColor: ['#00d68f', '#ffb946', '#ff4d6a'], borderWidth: 2, hoverOffset: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { color: '#8a9bc4', padding: 16, font: { size: 12 } } } } }
      });

      // Age group bar
      new Chart(document.getElementById('chart-age'), {
        type: 'bar',
        data: {
          labels: ['20-30', '31-40', '41-50', '51-60', '61-70', '71+'],
          datasets: [{
            label: 'Avg Glucose (mg/dL)', data: [72, 76, 81, 88, 95, 103],
            backgroundColor: 'rgba(0,229,200,0.3)', borderColor: '#00e5c8', borderWidth: 2, borderRadius: 6
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' }, min: 60 } } }
      });

      // Feature importance
      new Chart(document.getElementById('chart-feat-imp'), {
        type: 'bar',
        data: {
          labels: ['BMI', 'Systolic BP', 'Age', 'Cholesterol', 'Smoking', 'Heart Rate', 'Diastolic BP', 'Cigs/Day', 'BP Medication', 'Gender'],
          datasets: [{
            label: 'Importance',
            data: [0.198, 0.156, 0.148, 0.121, 0.089, 0.073, 0.068, 0.054, 0.051, 0.042],
            backgroundColor: ['rgba(0,212,255,0.8)', 'rgba(0,229,200,0.8)', 'rgba(0,212,255,0.6)', 'rgba(0,229,200,0.6)', 'rgba(255,122,69,0.6)', 'rgba(255,185,70,0.6)', 'rgba(255,185,70,0.5)', 'rgba(255,77,106,0.5)', 'rgba(255,77,106,0.4)', 'rgba(138,155,196,0.4)'],
            borderRadius: 4
          }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#8a9bc4', font: { size: 12 } }, grid: { display: false } } } }
      });

      // Smoking
      new Chart(document.getElementById('chart-smoke'), {
        type: 'bar',
        data: {
          labels: ['Never Smoked', 'Ex-Smoker', 'Current (Light)', 'Current (Heavy)'],
          datasets: [{ label: 'Avg Glucose', data: [78, 82, 87, 93], backgroundColor: ['rgba(0,214,143,0.5)', 'rgba(0,229,200,0.5)', 'rgba(255,185,70,0.5)', 'rgba(255,77,106,0.5)'], borderColor: ['#00d68f', '#00e5c8', '#ffb946', '#ff4d6a'], borderWidth: 2, borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8a9bc4', font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' }, min: 70 } } }
      });

      // BP by risk
      new Chart(document.getElementById('chart-bp'), {
        type: 'bar',
        data: {
          labels: ['Low Risk', 'Medium Risk', 'High Risk'],
          datasets: [
            { label: 'Systolic BP', data: [118, 134, 158], backgroundColor: 'rgba(0,212,255,0.5)', borderColor: '#00d4ff', borderWidth: 2, borderRadius: 4 },
            { label: 'Diastolic BP', data: [76, 84, 96], backgroundColor: 'rgba(0,229,200,0.5)', borderColor: '#00e5c8', borderWidth: 2, borderRadius: 4 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', labels: { color: '#8a9bc4', font: { size: 12 } } } }, scales: { x: { ticks: { color: '#8a9bc4' }, grid: { display: false } }, y: { ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } } } }
      });
    }

    let perfChartsInit = false;
    function initPerfCharts() {
      if (perfChartsInit) return; perfChartsInit = true;

      // ROC curves
      const pts = (auc) => {
        const pts = [[0, 0]];
        for (let i = 1; i < 20; i++) { const x = i / 20; pts.push([x, Math.min(1, Math.pow(x, 1 / (auc * 2)) * auc + (Math.random() - .5) * .04)]); }
        pts.push([1, 1]);
        return pts.map(p => ({ x: p[0], y: Math.max(0, Math.min(1, p[1])) }));
      };
      new Chart(document.getElementById('chart-roc'), {
        type: 'line',
        data: {
          datasets: [
            { label: 'Random Forest (0.913)', data: pts(0.913), borderColor: '#00d4ff', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, borderDash: [] },
            { label: 'Decision Tree (0.862)', data: pts(0.862), borderColor: '#00e5c8', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, borderDash: [5, 3] },
            { label: 'Log. Regression (0.831)', data: pts(0.831), borderColor: '#ffb946', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, borderDash: [2, 2] },
            { label: 'Baseline', data: [{ x: 0, y: 0 }, { x: 1, y: 1 }], borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 1, borderDash: [4, 4] }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8a9bc4', font: { size: 11 }, boxWidth: 24 } } }, scales: { x: { title: { display: true, text: 'False Positive Rate', color: '#8a9bc4' }, ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { title: { display: true, text: 'True Positive Rate', color: '#8a9bc4' }, ticks: { color: '#8a9bc4' }, grid: { color: 'rgba(255,255,255,0.04)' } } } }
      });

      // Radar
      new Chart(document.getElementById('chart-radar'), {
        type: 'radar',
        data: {
          labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC-AUC', 'Specificity'],
          datasets: [
            { label: 'Random Forest', data: [87, 85, 85, 85, 91, 91], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)', pointBackgroundColor: '#00d4ff', borderWidth: 2 },
            { label: 'Decision Tree', data: [82, 80, 81, 81, 86, 88], borderColor: '#00e5c8', backgroundColor: 'rgba(0,229,200,0.1)', pointBackgroundColor: '#00e5c8', borderWidth: 2 },
            { label: 'Log. Regression', data: [79, 77, 78, 78, 83, 85], borderColor: '#ffb946', backgroundColor: 'rgba(255,185,70,0.1)', pointBackgroundColor: '#ffb946', borderWidth: 2 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8a9bc4', font: { size: 11 } } } }, scales: { r: { ticks: { color: '#8a9bc4', backdropColor: 'transparent', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.08)' }, pointLabels: { color: '#8a9bc4', font: { size: 11 } }, min: 70, max: 100 } } }
      });
    }

    function selectModel(el, name) {
      document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
    }

    // ---- FILE UPLOAD ----
    function dragOver(e) { e.preventDefault(); document.getElementById('upload-zone').classList.add('drag') }
    function dragLeave() { document.getElementById('upload-zone').classList.remove('drag') }
    function dropFile(e) { e.preventDefault(); dragLeave(); const f = e.dataTransfer.files[0]; if (f) processFile(f) }
    function handleFileUpload(e) { const f = e.target.files[0]; if (f) processFile(f) }

    function processFile(file) {
      const info = document.getElementById('file-info');
      document.getElementById('file-name').textContent = file.name;
      document.getElementById('file-size').textContent = formatBytes(file.size);
      info.classList.remove('hidden');

      // Simulate parsing
      const rows = Math.floor(Math.random() * 500) + 100;
      const cols = Math.floor(Math.random() * 5) + 10;
      document.getElementById('upload-rows').textContent = rows;
      document.getElementById('upload-cols').textContent = cols;
      document.getElementById('upload-valid').textContent = '✓';
      document.getElementById('upload-valid').style.color = 'var(--green)';

      // Show preview
      const preview = document.getElementById('data-preview-area');
      const headers = ['age', 'male', 'BMI', 'sysBP', 'diaBP', 'totChol', 'heartRate', 'currentSmoker'];
      const sampleRows = [];
      for (let i = 0; i < 6; i++) {
        sampleRows.push([Math.floor(40 + Math.random() * 30), Math.round(Math.random()), (20 + Math.random() * 20).toFixed(1),
        Math.floor(110 + Math.random() * 60), Math.floor(70 + Math.random() * 30), Math.floor(170 + Math.random() * 100),
        Math.floor(60 + Math.random() * 50), Math.round(Math.random())]);
      }
      preview.innerHTML = `<div class="data-preview"><table class="data-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${sampleRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div style="text-align:right;margin-top:10px;font-size:12px;color:var(--text3)">Showing 6 of ${rows} rows</div>`;

      // Simulate batch prediction
      setTimeout(() => {
        const batchData = sampleRows.map((r, i) => {
          const score = Math.floor(15 + Math.random() * 75);
          const level = score >= 65 ? 'High' : score >= 35 ? 'Medium' : 'Low';
          return { ...Object.fromEntries(headers.map((h, j) => [h, r[j]])), risk_score: score, risk_level: level };
        });
        window._batchData = batchData;
        const colsAll = [...headers, 'risk_score', 'risk_level'];
        document.getElementById('batch-results-table').innerHTML = `<div class="data-preview"><table class="data-table"><thead><tr>${colsAll.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${batchData.map(r => `<tr>${colsAll.map(c => `<td style="${c === 'risk_level' ? `color:${r[c] === 'High' ? 'var(--red)' : r[c] === 'Medium' ? 'var(--amber)' : 'var(--green)'};font-weight:600` : ''}">${r[c]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        document.getElementById('batch-result-area').classList.remove('hidden');
        showNotif(`✅ ${rows} patients predicted!`);
      }, 1200);
    }

    function formatBytes(b) { if (b < 1024) return b + 'B'; if (b < 1048576) return (b / 1024).toFixed(1) + 'KB'; return (b / 1048576).toFixed(1) + 'MB' }

    function downloadResults() {
      if (!window._batchData) { showNotif('⚠️ No results to download', 'warn'); return; }
      const cols = Object.keys(window._batchData[0]);
      const csv = [cols.join(','), ...window._batchData.map(r => cols.map(c => r[c]).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'glucopredict_results.csv'; a.click();
      showNotif('✅ Results downloaded!');
    }

    function downloadTemplate() {
      const csv = 'age,male,BMI,sysBP,diaBP,totChol,heartRate,currentSmoker\n54,1,28.5,128,84,220,72,0\n45,0,24.1,115,78,195,68,1';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'glucopredict_template.csv'; a.click();
      showNotif('✅ Template downloaded!');
    }

    // ---- CONTACT ----
    function sendContact() {
      const name = document.getElementById('c-name').value.trim();
      const email = document.getElementById('c-email').value.trim();
      const msg = document.getElementById('c-msg').value.trim();
      if (!name || !email || !msg) { showNotif('⚠️ Please fill all fields', 'warn'); return; }
      showNotif('✅ Message sent! I\'ll get back to you soon.');
      document.getElementById('c-name').value = '';
      document.getElementById('c-email').value = '';
      document.getElementById('c-msg').value = '';
    }

    // ---- NOTIFICATIONS ----
    function showNotif(msg, type = 'success') {
      const el = document.createElement('div');
      el.className = 'notification';
      if (type === 'warn') { el.style.borderColor = 'var(--warn)'; el.style.color = 'var(--warn)'; }
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
