# app.py (Flask application)
from flask import Flask, render_template, request, jsonify, session
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secure secret key

@app.route('/')
def index():
    
    return render_template('n1.html')



if __name__ == '__main__':
    app.run(host="192.168.1.232", port=5000, debug=True)