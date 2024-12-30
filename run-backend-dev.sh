#!/bin/bash
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Install requirements if they haven't been installed
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in backend directory"
    exit 1
fi

# Run the application
python run.py