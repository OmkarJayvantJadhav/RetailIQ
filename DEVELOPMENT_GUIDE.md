# RetailIQ - End-to-End Development Guide

This guide walks you through how the RetailIQ platform was built from scratch, file-by-file, how the frontend and backend are integrated, and how to deploy the finished product to the internet.

---

## 1. Project Architecture
RetailIQ is a full-stack web application designed for high-performance e-commerce analytics.
- **Database:** PostgreSQL (hosted on Neon)
- **Backend:** Python + FastAPI + SQLAlchemy
- **Frontend:** React + Vite + Tailwind CSS + Recharts
- **Data Source:** Google BigQuery (TheLook eCommerce public dataset)

---

## 2. Setting Up the Foundation

### Step 1: Initialize the Monorepo
Create the root folder to house both the frontend and backend.
```bash
mkdir RetailIQ
cd RetailIQ
```

### Step 2: Set up the Backend (FastAPI)
Create the `backend/` directory and set up a Python virtual environment.
```bash
mkdir backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose passlib bcrypt
```

### Step 3: Set up the Frontend (React + Vite)
In the root directory, scaffold the frontend using Vite.
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install tailwindcss postcss autoprefixer react-router-dom recharts lucide-react axios
npx tailwindcss init -p
```

---

## 3. Developing the Backend (File by File)

The backend is structured using a modular API design.

### `backend/app/db/database.py`
This file connects to your PostgreSQL database.
- It uses `sqlalchemy.create_engine` to connect to your database URL.
- It sets up a `SessionLocal` class to allow routes to open database sessions.

### `backend/app/models/database_models.py`
This file defines your SQL tables using Python classes (SQLAlchemy ORM).
- **Classes:** `User`, `Customer`, `Product`, `Order`, `OrderItem`, `Inventory`.
- **Relationships:** Defines how tables link together (e.g., one `Order` has many `OrderItem`s).

### `backend/app/schemas/api_schemas.py`
This file defines Pydantic models for data validation.
- It ensures that data coming in (POST/PUT) and going out (GET) is strictly typed (e.g., ensuring `order_date` is a `datetime`).

### `backend/app/api/*.py` (The Routes)
The API logic is split into separate files:
- **`analytics.py` & `dashboard.py`**: Runs heavy SQL aggregations (SUM, COUNT) to calculate revenue, profit, and trends for the dashboard charts.
- **`products.py`, `orders.py`, `customers.py`**: Standard CRUD (Create, Read, Update, Delete) routes for managing data.
- **`auth.py`**: Handles user login, hashing passwords with bcrypt, and issuing JWT access tokens.

### `backend/app/main.py`
The entry point for FastAPI. 
- It sets up **CORS Middleware** (crucial for allowing the frontend to talk to the backend).
- It registers all the API routers using `app.include_router()`.

---

## 4. Developing the Frontend (File by File)

The frontend uses React and Tailwind CSS to create a beautiful, dynamic UI.

### `frontend/src/App.jsx`
The main routing file.
- It wraps the app in the `AuthProvider` (to track login state) and a `ThemeProvider` (for Dark Mode).
- It uses `react-router-dom` to map URLs to specific page components (e.g., `/dashboard` loads `DashboardLayout`).

### `frontend/src/context/AuthContext.jsx`
Manages the user's session globally.
- It provides a `login()` function that sends the username/password to the backend `/api/auth/login`.
- If successful, it stores the JWT token in `localStorage` so the user stays logged in even if they refresh the page.

### `frontend/src/services/api.js`
The central nervous system for API calls.
- Uses Axios to communicate with the backend.
- It automatically attaches the JWT token to the `Authorization` header of every single request.

### `frontend/src/pages/`
Each page gets its own folder and component:
- **`DashboardPage.jsx`**: Fetches data from `/api/dashboard/stats` and renders massive KPI cards and Recharts graphs.
- **`ForecastPage.jsx`**: Fetches data from the inventory analytics engine to show which products are at risk of a stockout.
- **`OrdersPage.jsx` & `ProductsPage.jsx`**: Displays data tables for managing standard eCommerce operations.

---

## 5. Integrating the System

How the whole system communicates:

1. **User Action:** A user visits the dashboard and clicks "Generate Report".
2. **Frontend Request:** `api.js` fires an Axios GET request to `https://your-backend-url.com/api/dashboard/stats`. It includes the JWT token in the header.
3. **Backend Authentication:** FastAPI receives the request, checks the token via `dependencies.get_current_user`, and verifies the user is valid.
4. **Database Query:** The backend runs a SQLAlchemy query against the Neon PostgreSQL database to sum up the revenue.
5. **JSON Response:** The backend packages the results as a JSON object (validated by Pydantic) and sends it back.
6. **UI Update:** The React frontend receives the JSON, updates its State, and Recharts instantly draws a new graph on the screen.

---

## 6. Populating Data (Google BigQuery)

Because empty dashboards are boring, we wrote a pipeline to download real eCommerce data from Google BigQuery:

- **`analytics/load_bigquery_data_full.py`**: Connects to GCP using a service account JSON file.
- It downloads tens of thousands of rows of customers, products, and orders using Pandas.
- It wipes the Neon database clean, recreates the schema, and uploads the BigQuery data via `to_sql()`.

---

## 7. Deployment

To make the app accessible to the world, the components are hosted on specialized cloud providers.

### Step 1: Database (Neon.tech)
1. Create a free serverless Postgres database on Neon.
2. Get your connection string (`postgresql://user:pass@host/dbname`).
3. Save this as a `DATABASE_URL` environment variable on your backend host.

### Step 2: Backend (Render.com)
1. Link your GitHub repository to Render as a "Web Service".
2. Set the Root Directory to `backend/`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Add Environment Variables: `DATABASE_URL`, `JWT_SECRET_KEY`.

### Step 3: Frontend (Vercel.com)
1. Link your GitHub repository to Vercel.
2. Set the Framework Preset to "Vite".
3. Set the Root Directory to `frontend/`.
4. Build Command: `npm run build`
5. Add Environment Variable: `VITE_API_URL` (Set this to the live URL of your Render backend!).

### Final Result
Whenever you push code to GitHub:
1. Render automatically rebuilds your Python backend.
2. Vercel automatically rebuilds your React frontend.
3. Your live URL (`https://retail-iq-analytics.vercel.app`) is instantly updated with zero downtime!
