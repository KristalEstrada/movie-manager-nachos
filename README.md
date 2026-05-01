Movie Manager Nachos

Movie Manager Nachos is a full-stack web application built with a FastAPI backend and a React + Vite frontend.

Prerequisites

Before running this project, make sure you have the following installed:

Python 3.11.5
Node.js
npm
Git

Project Structure

movie-manager-nachos/
├── backend/
├── frontend/
├── data/
├── requirements.txt
└── .gitignore

Step-by-Step Instructions to Run the Project

Clone the repository
git clone <your-repository-url>
cd movie-manager-nachos
Create a virtual environment
python3 -m venv .venv
Activate the virtual environment

Mac/Linux:
source .venv/bin/activate

Windows:
.venv\Scripts\activate

Install backend dependencies
pip install -r requirements.txt
Start the backend server
python -m uvicorn backend.main:app --reload --host localhost --port 8000

Backend will run at:
http://localhost:8000

Open a second terminal
Keep the backend running. Open a new terminal for the frontend.
Navigate to the frontend folder
cd frontend
Install frontend dependencies
npm install
Start the frontend
npm run dev

Frontend will run at:
http://localhost:5173

Repeatable Deployment Method

This project uses a repeatable setup process. The backend is set up using a virtual environment and dependencies listed in requirements.txt. The frontend is set up using npm install and dependencies defined in package.json.

Any user can follow the steps above to successfully run the application on their machine.

Expected Result

Backend runs on http://localhost:8000
Frontend runs on http://localhost:5173
The application loads successfully and core features function as expected

Git Workflow

Branches:

main → production-ready code
dev → shared integration branch
feature/<name>-<task> → individual work

Rules:

Create feature branches from dev
Push only to your feature branch
Open pull requests into dev
Do not push directly to dev

Basic Workflow:

Clone the repository
Switch to the dev branch
Create a feature branch
Make changes
Commit and push
Open a pull request into dev
After review, merge the pull request



After starting the application, follow these steps to confirm it is working:

Open a web browser
Go to http://localhost:5173
Verify that the application loads without errors
Navigate to the main feature (such as viewing the movie list or schedule)
Confirm that movie data is displayed correctly
Click on a movie or interact with the page to ensure it responds properly
