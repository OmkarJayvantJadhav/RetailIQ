# RetailIQ - Comprehensive Development & Architecture Guide

This is the ultimate, in-depth technical manual for the RetailIQ platform. It covers exactly how this platform was conceived and built from an empty folder into a fully deployed, full-stack application handling tens of thousands of rows of real eCommerce data.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1: Project Initialization](#2-phase-1-project-initialization)
3. [Phase 2: Database Design & Backend Setup (FastAPI)](#3-phase-2-database-design--backend-setup-fastapi)
4. [Phase 3: Building the Frontend (React + Vite)](#4-phase-3-building-the-frontend-react--vite)
5. [Phase 4: The Data Pipeline (Google BigQuery)](#5-phase-4-the-data-pipeline-google-bigquery)
6. [Phase 5: API Integration & Data Flow Lifecycle](#6-phase-5-api-integration--data-flow-lifecycle)
7. [Phase 6: Production Deployment (Neon, Render, Vercel)](#7-phase-6-production-deployment-neon-render-vercel)

---

## 1. Architecture Overview

RetailIQ relies on a highly decoupled, modern web stack. This ensures the backend can process heavy data analytics without slowing down the frontend's user interface.

- **Frontend (Client Tier):** React.js (via Vite) styled with Tailwind CSS. It uses `react-router-dom` for client-side routing, `axios` for HTTP requests, and `recharts` for rendering complex data visualizations.
- **Backend (API Tier):** Python with FastAPI. FastAPI was chosen because of its incredible speed (using ASGI) and its seamless integration with Pydantic for automatic JSON validation.
- **Database (Data Tier):** PostgreSQL. We use SQLAlchemy as the Object-Relational Mapper (ORM) to translate Python code into raw SQL queries.
- **Data Source:** Google BigQuery (TheLook eCommerce Dataset).

---

## 2. Phase 1: Project Initialization

Every full-stack project starts with directory scaffolding. We used a monorepo approach, meaning both the frontend and backend live in the same Git repository (`RetailIQ`).

### Step-by-step commands used:
```bash
# Create the root folder
mkdir RetailIQ
cd RetailIQ

# Scaffold the frontend using Vite (which is exponentially faster than Create-React-App)
npm create vite@latest frontend -- --template react

# Create the backend folder
mkdir backend
cd backend

# Create a Python Virtual Environment to isolate dependencies
python -m venv venv
venv\Scripts\activate # (On Windows)

# Install Core Backend Libraries
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose passlib bcrypt pandas google-cloud-bigquery db-dtypes
```

---

## 3. Phase 2: Database Design & Backend Setup (FastAPI)

The backend was built layer-by-layer, starting from the database connection, moving to the data models, and finishing with the API routes.

### Layer 1: The Database Connection (`backend/app/db/database.py`)
This file is responsible for establishing a secure connection to PostgreSQL.
- We use `create_engine(DATABASE_URL)` to create the connection pool.
- We create a `SessionLocal` class using `sessionmaker()`. Every time an API request is made, a new session is spun up and closed when the request finishes.
- `Base = declarative_base()` creates a blueprint that our SQL tables will inherit from.

### Layer 2: The SQL Models (`backend/app/models/database_models.py`)
This file translates Python classes into actual PostgreSQL tables. 
- For example, `class Product(Base):` becomes the `products` table.
- We define explicit relationships (e.g., `inventory = relationship("Inventory", back_populates="product")`). This allows SQLAlchemy to automatically perform `JOIN` operations when we need to fetch a product and its current inventory stock simultaneously.

### Layer 3: Pydantic Validation Schemas (`backend/app/schemas/api_schemas.py`)
FastAPI requires strict data typing to validate incoming and outgoing JSON.
- We created "Base" schemas (e.g., `OrderBase`) and then extended them for specific use cases (e.g., `OrderCreate` for POST requests, `OrderResponse` for GET requests).
- **Crucial Detail:** We mapped database `DateTime` columns strictly to Python `datetime` objects to ensure the API didn't crash when converting BigQuery's exact millisecond timestamps.

### Layer 4: The Core API Routes (`backend/app/api/`)
Instead of putting all API logic in one massive file, we used `APIRouter()` to split it up:
- **`analytics.py` & `dashboard.py`**: These contain complex SQL aggregation queries. For instance, to calculate Total Revenue, the route runs a SQLAlchemy query equivalent to `SELECT SUM(line_total) FROM order_items`.
- **`auth.py`**: Handles security. It accepts a username/password, hashes the password using `bcrypt`, checks it against the database, and if successful, generates a JWT (JSON Web Token) via the `python-jose` library.

### Layer 5: The Main Entrypoint (`backend/app/main.py`)
This is the file that Uvicorn actually runs.
- We set up `CORSMiddleware`. This is extremely important. By default, web browsers block frontend code (running on `vercel.app`) from requesting data from a different backend domain (`render.com`). CORS explicitly tells the browser that this communication is safe and permitted.
- We include all the routers (e.g., `app.include_router(analytics.router, prefix="/api/analytics")`).

---

## 4. Phase 3: Building the Frontend (React + Vite)

The frontend is a Single Page Application (SPA). The browser loads a single HTML file, and React takes over to draw the interface dynamically.

### Step 1: Tailwind CSS Configuration
We initialized Tailwind and configured `tailwind.config.js` to scan all our `.jsx` files for CSS classes. We also added custom color themes (like `brand-blue`, `brand-purple`) to give RetailIQ its premium aesthetic.

### Step 2: Global State & Security (`frontend/src/context/AuthContext.jsx`)
We needed a way to remember if a user was logged in across different pages.
- We used React's `createContext`.
- When a user logs in successfully, the backend returns a JWT token.
- `AuthContext` saves this token to the browser's `localStorage` and sets an `isAuthenticated` boolean to `true`.
- If the token expires or is cleared, the user is instantly redirected back to the Login page.

### Step 3: Centralized API Client (`frontend/src/services/api.js`)
Instead of writing raw `fetch()` calls on every page, we created a central Axios instance.
- We configured an "Axios Interceptor". Every single time the frontend makes an API call, this interceptor automatically grabs the JWT token from `localStorage` and attaches it to the request's `Authorization: Bearer <token>` header.

### Step 4: Page Components & UI (`frontend/src/pages/`)
We built specific pages for different dashboard views:
- **`DashboardPage.jsx`**: Uses React's `useEffect` to trigger an API call to `/api/dashboard/stats` as soon as the page loads. It then feeds the returned JSON data into Recharts to draw the revenue and profit trend lines.
- **`ForecastPage.jsx`**: Contains complex logic to render "Risk Badges" (Red/Yellow/Green) based on the inventory stock divided by the average daily sales.

---

## 5. Phase 4: The Data Pipeline (Google BigQuery)

Because a dashboard is useless without data, we engineered a custom Python ETL (Extract, Transform, Load) pipeline in `analytics/load_bigquery_data_full.py`.

1. **Extract:** Using the `google-cloud-bigquery` library, the script connects to Google Cloud Platform and runs SQL queries against the public `thelook_ecommerce` dataset, downloading tens of thousands of rows of real user and product data.
2. **Transform:** The script uses Pandas DataFrames to manipulate the data. It renames columns to match our SQLAlchemy models, generates mock payment data, and formats timestamps.
3. **Load:** The script completely drops the existing Neon database schema (to avoid duplicate primary key collisions), recreates the fresh tables using `Base.metadata.create_all()`, and pushes the Pandas DataFrames directly into the database using `df.to_sql()`.

---

## 6. Phase 5: API Integration & Data Flow Lifecycle

Here is the exact, step-by-step technical lifecycle of what happens when a user views the Executive Dashboard:

1. **The Click:** The user navigates to `/dashboard` in their browser.
2. **The Component Mounts:** React renders `DashboardPage.jsx`. A `useEffect` hook fires immediately.
3. **The Axios Request:** The frontend calls `api.get('/dashboard/stats')`. The Axios interceptor silently attaches the user's JWT token.
4. **The Internet Trip:** The request travels from the user's browser to our Render backend server.
5. **The FastAPI Reception:** `main.py` intercepts the request. The CORS middleware allows it through. The route is directed to `app.api.dashboard`.
6. **The Authentication Check:** FastAPI sees `Depends(get_current_user)`. It decodes the JWT token. If valid, it allows the request to proceed.
7. **The Database Query:** The Python route executes a SQLAlchemy command. SQLAlchemy converts this into raw SQL: `SELECT SUM(line_total) FROM order_items`.
8. **The Database Execution:** The SQL query is sent over the internet to the Neon PostgreSQL database. Neon calculates the sum and returns the number.
9. **The Pydantic Validation:** The Python backend receives the number, formats it into a dictionary, and passes it through the `DashboardStats` Pydantic model to ensure it is strictly formatted.
10. **The JSON Return:** The backend sends the validated JSON payload back to the browser with an HTTP 200 OK status.
11. **The UI Update:** The Axios request in `DashboardPage.jsx` resolves. React calls `setStats(response.data)`. The state change forces React to re-render the screen, instantly displaying the exact revenue number in the UI.

*This entire 11-step process takes approximately 150-300 milliseconds.*

---

## 7. Phase 6: Production Deployment (Neon, Render, Vercel)

Moving from "localhost" to the live internet required three distinct cloud providers.

### 1. Database Deployment: Neon.tech (Serverless Postgres)
- **Why Neon?** It separates storage and compute, allowing the database to scale to zero when unused (saving money) and instantly wake up when a request hits.
- **Process:** We created a project, grabbed the connection string (`postgresql://neondb_owner:...`), and set this as the `DATABASE_URL` for our backend.

### 2. Backend Deployment: Render.com
- **Why Render?** It natively supports Python environments and integrates perfectly with GitHub for CI/CD (Continuous Integration / Continuous Deployment).
- **Process:** 
  1. Connected the GitHub repository to Render.
  2. Set the Environment to `Python 3`.
  3. Set the Root Directory to `./backend`.
  4. Build Command: `pip install -r requirements.txt`. (This downloads all the FastAPI/SQLAlchemy libraries to Render's server).
  5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. (This binds the FastAPI server to Render's internal networking).
  6. Added the `DATABASE_URL` environment variable so Render knows how to talk to Neon.

### 3. Frontend Deployment: Vercel.com
- **Why Vercel?** It is optimized explicitly for Vite/React applications, offering blazing-fast Global CDNs.
- **Process:**
  1. Connected the GitHub repository to Vercel.
  2. Set the Root Directory to `./frontend`.
  3. Build Command: `npm run build`. (This compiles the React JSX and Tailwind CSS into minified, highly optimized vanilla JavaScript, HTML, and CSS).
  4. Added the `VITE_API_URL` environment variable, pointing it directly to the live Render backend URL (e.g., `https://retailiq-backend.onrender.com`).
  5. Vercel deployed the static assets to edge nodes around the world.

### The CI/CD Loop
Because Vercel and Render are connected directly to the GitHub repository's `main` branch, the deployment process is entirely automated. 
Whenever a developer runs `git push origin main`, both Render and Vercel instantly detect the new code, spin up isolated build containers, compile the code, and seamlessly swap the live servers with zero downtime.
