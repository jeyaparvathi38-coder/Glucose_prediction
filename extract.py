with open('e:/GLUCOSE_PREDICTION/GlucoPredict_App.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

css_lines = lines[14:1528]
with open('e:/GLUCOSE_PREDICTION/backend/static/css/style.css', 'w', encoding='utf-8') as f:
    f.writelines(css_lines)

js_lines = lines[2436:2905]
with open('e:/GLUCOSE_PREDICTION/backend/static/js/main.js', 'w', encoding='utf-8') as f:
    f.writelines(js_lines)

html_head = lines[0:13]
html_link = ['  <link rel="stylesheet" href="{{ url_for(\'static\', filename=\'css/style.css\') }}">\n']
html_body = lines[1529:2435]
html_script = ['  <script src="{{ url_for(\'static\', filename=\'js/main.js\') }}"></script>\n']
html_end = lines[2906:]

html = html_head + html_link + html_body + html_script + html_end
with open('e:/GLUCOSE_PREDICTION/backend/templates/index.html', 'w', encoding='utf-8') as f:
    f.writelines(html)
print("Files extracted successfully!")
