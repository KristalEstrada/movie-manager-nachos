# 🎬 Movie Manager Nachos

Movie Manager Nachos is a full-stack application with a FastAPI backend and a React + Vite frontend.

---

## 📌 Prerequisites

Before running this project, make sure you have:

- Python 3.11.5
- Node.js
- npm
- Git

---

## 📁 Project Structure

movie-manager-nachos/
- backend/
- frontend/
- data/
- requirements.txt
- .gitignore

---

## 🚀 Step-by-Step Instructions to Run the Project

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd movie-manager-nachos

### 2. Create a virtual environment
python3 -m venv .venv

### 3. Activate the virtual environment
Mac/Linux
source .venv/bin/activate
Windows
.venv\Scripts\activate
### 4. Install backend dependencies
pip install -r requirements.txt

###5. Start the backend server
python -m uvicorn backend.main:app --reload --host localhost --port 8000

### 6. Open a second terminal

Keep the backend running. Open a new terminal for the frontend.

### 7. Go to the frontend folder
cd frontend

###8. Install frontend dependencies

### 9. Start the frontend
npm run dev

Frontend will run at:
http://localhost:5173
npm install

🔁 Repeatable Deployment Method

This project uses a repeatable setup process:

Backend is set up using a virtual environment and requirements.txt
Frontend is set up using npm install and package.json

Any user can follow the steps above to successfully run the project on their machine.

🌿 Git Workflow
main → production-ready code
dev → shared integration branch
feature/<name>-<task> → individual work
###Rules
Create feature branches from dev
Push only to your feature branch
Open Pull Requests into dev
Do not push directly to dev
###Basic Workflow
Clone the repository
Switch to the dev branch
Create a feature branch
Make changes
Commit and push
Open a Pull Request into dev
After review, merge the Pull Request
