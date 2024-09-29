# Makefile for Flask KMeans Application

# Installing Python dependencies
install:
	@echo "Installing dependencies..."
	@pip install -r requirements.txt

# Running a Flask App
run:
	@echo "Starting the Flask application on http://localhost:3000..."
	@python app.py
