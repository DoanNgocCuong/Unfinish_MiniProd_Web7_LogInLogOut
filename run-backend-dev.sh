#!/bin/bash
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Install requirements if they haven't been installed
pip install -r requirements.txt

# Copy .env.development to .env for development environment
cp .env.development .env

# Run the application
python run.py