# TeachLearn - Teacher Personal Learning Platform

TeachLearn is a comprehensive, production-ready educational platform designed to connect teachers and students. It provides tools for sharing academic resources, managing circulars, discussing topics in a community forum, and facilitating mentorship.

## 🚀 Features

*   **📚 Resource Libraries (Notes & Videos):** Categorized and easily searchable study materials.
*   **📣 Circulars & Announcements:** Admin-only broadcasting system for important updates.
*   **💬 Community Forum:** A dynamic feed with posts, likes, and comments for student interaction.
*   **🤝 Mentorship System:** A dedicated pipeline for matching students with faculty mentors.
*   **🔐 Secure Authentication:** Firebase-powered role-based access control (Student vs Admin).
*   **⚡ High Performance:** Built with Vite, React Query for optimistic updates, and a lightning-fast FastAPI backend using Firestore.

## 🛠️ Technology Stack

**Frontend:**
*   React 18 & Vite
*   Tailwind CSS & Shadcn UI & Framer Motion
*   TanStack React Query
*   Firebase Auth

**Backend:**
*   Python 3.10+ & FastAPI
*   Google Cloud Firestore (NoSQL)
*   Pydantic (Validation)
*   Uvicorn

## 📦 Project Structure

The repository is structured as a monorepo:

```
/
├── frontend/       # Vite + React web application
└── backend/        # FastAPI Python server
```

## ⚙️ Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # (On Windows)
pip install -r requirements.txt
```
*Note: Ensure you place your `google-credentials.json` in the backend root and set the `GOOGLE_APPLICATION_CREDENTIALS` path in your `.env` file.*

Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
*Note: Create an `.env.local` file containing your Firebase configuration keys (VITE_FIREBASE_API_KEY, etc).*

Start the frontend development server:
```bash
npm run dev
```

## 🔒 Security & Environment Variables
**Never commit your `.env` files or Google Service Account `.json` keys.** 
The `.gitignore` is already configured to prevent these from being pushed to GitHub. Please refer to `.env.example` in both directories for the required variables.
