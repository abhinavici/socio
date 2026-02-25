# Task Pilot Frontend

React + Vite client for the Task Pilot task manager.

## Features

- Login and registration flow
- JWT-aware route protection
- Dashboard with create, edit, status toggle, delete, and filter actions
- Session handling for expired/invalid token

## Environment

Create `frontend/.env` if you want a custom API URL:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

If omitted, the app defaults to `http://localhost:5000/api`.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
```
