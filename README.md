# movie-manager-nachos
## Git Workflow

To ensure smooth collaboration, the team will follow this branching strategy:

- The `main` branch contains production-ready code.
- The `dev` branch is the shared integration branch.
- All developers must create their own feature branch from `dev`.
- Feature branch naming format: `feature/<name>-<task>`
- Developers push changes only to their feature branch.
- Pull Requests (PRs) must target the `dev` branch.
- Direct pushes to `dev` are not allowed.

### Basic Workflow

1. Clone the repository  
2. Switch to the `dev` branch  
3. Create a feature branch  
4. Commit and push changes  
5. Open a Pull Request into `dev`  
6. After review, the PR is merged  

This workflow ensures all team members can safely contribute and merge code.
## Deployment & Installation Guide

### Prerequisites

Ensure the following are installed on your system:

- Python 3.10 or higher
- Git
- pip (Python package manager)

Verify installations:

```bash
python --version
git --version
```

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/KristalEstrada/movie-manager-nachos.git
cd movie-manager-nachos
```

---

### Step 2: Switch to the Dev Branch

```bash
git checkout dev
```

---

### Step 3: Create and Activate a Virtual Environment

Mac/Linux:

```bash
python -m venv .venv
source .venv/bin/activate
```

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

---

### Step 4: Install Dependencies

If the project includes a `requirements.txt` file:

```bash
pip install -r requirements.txt
```

If no external libraries are required, this project uses Python standard libraries only.

---

### Step 5: Run the Application

```bash
python main.py
```

(Adjust the filename if the main entry point changes.)

---

### Expected Result

The Movie Manager system will launch in the terminal.  
Users will be able to schedule and manage movie showtimes through the command-line interface.

---

### Repeatable Deployment

Following the steps above provides a consistent and repeatable deployment method. Any system meeting the prerequisites can install and run the application successfully.
