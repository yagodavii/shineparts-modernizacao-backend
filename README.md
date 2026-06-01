# ShineParts

ShineParts is a web system modernization project focused on backend consolidation, authentication improvements, API organization, and system reliability.

The project migrated from a duplicated backend structure with Flask and Node.js running in parallel to a single, more secure and maintainable Node.js/Express backend architecture.

## Overview

This repository documents the modernization of the ShineParts system, including backend refactoring, route improvements, authentication hardening, database initialization, CORS correction, and compatibility support for legacy routes.

## Previous Architecture

Before the migration, the system had two active backends running at the same time:

* Python/Flask backend: `backend/app.py`
* Node.js/Express backend: `backend/server.js`

This caused duplicated business rules, inconsistent routes, different behaviors for the same domain, weak input validation in some endpoints, and conflicts between routes, models, and the real SQLite schema.

The authentication flow was also less robust, and the frontend faced CORS issues due to blocked origins such as `localhost:3001`.

## Migration Applied

### 1. Unified Backend Architecture

The official backend was defined as Node.js with Express.

* Official API entry point: `backend/server.js`
* API base URL: `http://localhost:5000/api`
* Flask was marked as legacy to avoid conflicts and confusion

### 2. Flask Legacy Compatibility

The Flask backend was deprecated and converted into a legacy marker.

Requests to `/api/*` through Flask now return `410 Gone`, instructing users to use the Node.js backend instead.

The Flask port was also changed to `5050` to avoid conflict with the Node.js backend.

### 3. Security and Authentication

Authentication was improved with:

* Login validation through the Node.js backend
* JWT-based authentication
* Password hashing with bcrypt
* Legacy password migration when needed
* Role-based authorization middleware for `admin`, `manager`, and `seller`

### 4. Improved API Routes

Several routes were improved with better validation and more consistent responses:

* Products
* Orders
* Branches
* Users
* Settings

The backend now includes:

* Payload and parameter validation
* Centralized error handling
* More consistent HTTP responses: `400`, `401`, `403`, `404`, `409`, `500`
* Upload limits and file type validation

### 5. Legacy Route Compatibility

To avoid breaking existing flows, compatibility routes were preserved:

```http
POST /api/order
POST /api/admin/products
```

### 6. Chat and Intelligence Layer

The chat endpoint was integrated with:

```txt
backend/brain/SaraBrain.js
```

It supports user context and current route context to provide more intelligent responses.

### 7. Database Improvements

Database initialization was centralized in:

```txt
backend/database/index.js
```

Improvements included:

* `PRAGMA foreign_keys = ON`
* `PRAGMA journal_mode = WAL`
* Indexes for improved query performance
* Default admin user ensured with hashed password
* `backend/database/database.js` now points to the same database connection

### 8. CORS Fix

The backend now includes `http://localhost:3001` as an allowed origin.

This fixed the `403` error on:

```http
OPTIONS /api/auth/login
```

## Main Files Changed

```txt
backend/server.js
backend/app.py
backend/database/index.js
backend/database/database.js
backend/middleware/auth.js
backend/routes/auth.js
backend/routes/products.js
backend/routes/orders.js
backend/models/User.js
backend/models/Product.js
backend/models/Order.js
backend/BACKEND_ARCHITECTURE.md
```

## How to Run

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## URLs

```txt
Frontend: http://localhost:5173
API Health: http://localhost:5000/api/health
```

## Default Credentials

```txt
Username: admin
Password: admin
```

> Important: change the default credentials before using the system in any real environment.

## Troubleshooting

### Vite is not recognized

Run the following command inside the frontend folder:

```bash
npm install
```

### Login returns 403 on OPTIONS request

Possible cause: CORS origin not allowed.

Status: fixed by allowing `localhost:3001` in the backend.

### Login fails with correct credentials

Try the following steps:

1. Clear `localStorage`, especially the `shineray_token` key
2. Restart backend and frontend
3. Confirm the backend is running at:

```txt
http://localhost:5000/api/health
```

## Migration Result

The application now runs with a single backend architecture, stronger authentication, improved API routes, better database handling, corrected CORS configuration, and reduced operational risk for future product evolution.

## Tech Stack

* Node.js
* Express.js
* SQLite
* JWT
* bcrypt
* JavaScript
* REST APIs
* CORS
* Vite
* Legacy Flask compatibility

## Project Focus

This project demonstrates backend modernization, API refactoring, authentication improvements, database consistency, and system architecture simplification.
