# Delete the broken venv folder
Remove-Item -Path "venv" -Recurse -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Create fresh virtual environment
python -m venv venv

# Activate it
& .\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install Flask==2.3.2 Flask-CORS==4.0.0 pymongo==4.6.2 python-dotenv==1.0.1

Write-Host "Setup complete! Run: python app-simple.py" -ForegroundColor Green
