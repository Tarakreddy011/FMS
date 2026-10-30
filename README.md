# PayMyFee Frontend

Standalone React + Vite client for the existing Spring Boot fee-management API. This project is intended to be maintained and published independently from the backend repository.

## Local development

Prerequisites: Node.js 20.19+ or 22.12+ and a running backend on port 8080.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>. Set `VITE_API_BASE_URL` in `.env` if the backend uses another local URL. The backend's database settings are read from `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`; configure those in the backend environment.

The frontend calls the existing endpoints directly and uses the existing HTTP Basic login flow. Credentials are held in `sessionStorage` to match the current application. This is a local migration baseline, not a recommended public-production authentication design.

## Separate GitHub repository

This folder is outside the backend repository, has its own `.gitignore`, and is already initialized as a separate local Git repository. To publish it independently, create an empty GitHub repository for it, add that repository as `origin`, then commit and push. The backend remains in `FeeManagementSystem` and keeps its existing GitHub remote; no remote has been added and nothing has been pushed.

## Features

- Role-aware login and navigation for student, teacher, and admin users.
- Student profile, fee balance, payment submission, and receipt history.
- Teacher profile, assigned students, institution roster, and fee adjustment.
- Principal metrics, mentor assignment, fee adjustments, faculty workload, faculty onboarding/removal, and recent transactions.
