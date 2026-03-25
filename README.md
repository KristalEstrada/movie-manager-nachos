🎬 Movie Manager Nachos

A full-stack application with a FastAPI backend and React + Vite frontend for managing movie data.

📌 Prerequisites

Before running this project, make sure you have:

Python 3.11.5 (recommended for compatibility)
Node.js (v16 or higher)
npm (comes with Node)
Git
📁 Project Structure
movie-manager-nachos/
├── backend/
│   ├── __init__.py
│   └── main.py
├── data/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── requirements.txt
└── .gitignore
🚀 Deployment / Setup Instructions
1. Clone the Repository
git clone <your-repo-url>
cd movie-manager-nachos
⚙️ Backend Setup (FastAPI)
Step 1: Create Virtual Environment
python3 -m venv .venv
Step 2: Activate Virtual Environment

Mac/Linux:

source .venv/bin/activate

Windows:

.venv\Scripts\activate
Step 3: Install Dependencies
pip install -r requirements.txt
Step 4: Run Backend Server
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

Backend will run at:
👉 http://127.0.0.1:8000

⚠️ If Port 8000 Is Busy
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
💻 Frontend Setup (React + Vite)
Step 1: Open a New Terminal
cd frontend
Step 2: Install Dependencies
npm install
Step 3: Run Frontend
npm run dev

Frontend will run at:
👉 http://127.0.0.1:5173

🔗 Connecting Frontend to Backend

By default, the frontend connects to:

http://127.0.0.1:8000

If your backend runs on a different port:

VITE_API_PROXY_TARGET=http://127.0.0.1:8001 npm run dev
🔁 Repeatable Deployment Method

This project uses a script-based deployment approach, meaning:

Backend setup is reproducible using:
venv + requirements.txt
Frontend setup is reproducible using:
npm install + package.json

Any developer can follow the steps above to run the project consistently on their machine.

🌿 Git Workflow

To ensure smooth collaboration:

main → production-ready code
dev → integration branch
feature/<name>-<task> → individual work
Rules:
Create feature branches from dev
Push only to your feature branch
Open PRs into dev
No direct pushes to dev

