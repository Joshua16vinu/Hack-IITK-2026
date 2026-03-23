from flask import Flask
from flask_cors import CORS
import subprocess
import requests
import time

from routes.upload_route import upload_bp


app = Flask(__name__)
CORS(app)

@app.route('/')
def health_check():
    return 'Backend is running...'

@app.route('/check-llm')
def check_llm():
    try:
        requests.get("http://localhost:11434")
        return "LLM is running..."
    except:
        subprocess.Popen(["ollama", "serve"])
        time.sleep(3)
        return "LLM is starting..."


if __name__ == '__main__':
    app.register_blueprint(upload_bp, url_prefix='/api')
    # app.register_blueprint(gaps_bp, url_prefix='/api')
    # app.register_blueprint(revision_bp, url_prefix='/api')

    app.run(host='0.0.0.0', port=5000, debug=True)