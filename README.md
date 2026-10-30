# PayMyFee React Frontend

This repository contains the full React + Vite user interface. The Spring Boot API is maintained separately in [FeeManagementSystem](https://github.com/Tarakreddy011/FeeManagementSystem); it owns authentication, authorization, business rules, and database access. No legacy portal UI is served by the backend.

## Local Development

Prerequisites: Node.js 20.19+ or 22.12+, plus the backend running at `http://localhost:8080` with the MySQL `paymyfee` schema configured.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>. `VITE_API_BASE_URL` selects the backend origin and defaults to `http://localhost:8080`. All frontend requests, including login, go through the shared API client in `src/api.js`. The backend must allow the frontend origin; local CORS defaults to `http://localhost:5173` and can be overridden with `FRONTEND_ORIGIN`.

The backend reads `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`; configure the password outside source control. The current UI retains the existing HTTP Basic flow and stores encoded credentials in `sessionStorage`; this is not a production-ready authentication design.

## Backend Fallback Pages

If the backend root (`http://localhost:8080`) is opened, it shows a small fallback page linking to the React client. `/api-status.html` provides a simple API reachability check. These pages are diagnostic only; all user workflows belong to this React application.

## Build

```powershell
npm run build
```

## Main Workflows

- Student: profile, balance, payment, and receipt history.
- Teacher: assigned cohort, student roster, and fee updates.
- Principal: dashboard metrics, mentor assignment, fee ledger, faculty management, and transactions.
