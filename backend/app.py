import os
from flask import Flask, render_template
from flask_cors import CORS

from routes.api import api_blueprint

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    CORS(app)
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'glucopredict-secret')

    # Register blueprints
    app.register_blueprint(api_blueprint, url_prefix='/api')

    @app.route('/')
    def index():
        return render_template('index.html')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
