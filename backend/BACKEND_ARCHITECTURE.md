# Backend Architecture

## Official API
- Runtime: Node.js + Express
- Entry point: `server.js`
- Base URL: `http://localhost:5000/api`

## Legacy API
- `app.py` is kept only as a compatibility marker.
- Any `/api/*` request on Flask returns `410 Gone`.
- Flask now runs on port `5050` only to avoid conflict with Node.

## Current Route Source of Truth
- Active routes are implemented in `server.js`.
- `routes/*.js` and `models/*.js` were updated to match the current SQLite schema and can be used for future modularization.

## Database
- SQLite database file: `database/shineray.db`
- Initialization and schema: `database/index.js`
