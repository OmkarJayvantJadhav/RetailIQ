# RetailIQ: Enterprise Retail Analytics & Demand Forecasting Platform

![RetailIQ Logo](https://img.shields.io/badge/Retail-IQ-blue?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

RetailIQ is an end-to-end enterprise retail analytics platform with data engineering, machine learning forecasting, inventory optimization, customer analytics, and a full-stack web application.

## Features

- **Advanced Data Generation**: Generate millions of rows of realistic synthetic Indian retail data (customers, products, orders, returns, payments).
- **Data Engineering Pipeline**: Robust PostgreSQL schema with 12 normalized tables, views, indexes, and stored procedures for business logic.
- **Machine Learning Forecasting**: Predict demand using XGBoost, Random Forest, Ridge, and Linear Regression with robust backtesting.
- **Full-stack Application**: 
  - **Backend**: FastAPI with JWT Auth, SQLAlchemy ORM, Pydantic validation.
  - **Frontend**: React-based dashboard with glassmorphism dark theme, Recharts visualizations, and fully responsive layouts.

## Architecture

- `analytics/`: Python data pipelines (generation, cleaning, EDA, forecasting, recommendations).
- `backend/`: FastAPI application containing all REST endpoints and business logic.
- `frontend/`: React single-page application.
- `database/`: Complete SQL implementation including schema, indexes, views, procedures, and a robust query bank.
- `data/`: Local storage for generated CSVs and parquet files.
- `ml/`: Saved machine learning models and metrics.
- `reports/`: Markdown validation reports and EDA figures.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.10+ (for local backend/analytics dev)
- PostgreSQL 15+ (if running locally without Docker)

## Quick Start (Docker)

1. Ensure `.env` is properly configured (copy from `.env.example`).
2. Run the platform using Docker Compose:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

## Data Pipeline Execution (Local)

To generate data and populate the database locally:

```bash
cd analytics
pip install -r requirements.txt # (make sure to install pandas, numpy, faker, sqlalchemy, psycopg2)
python data_generation.py
python data_validation.py
python load_data.py
```

## Default Credentials

The platform is seeded with the following roles:
- **Admin**: `admin` / `admin123`
- **Analyst**: `analyst` / `analyst123`
- **Viewer**: `viewer` / `viewer123`

## SQL Query Bank

The `database/queries/` directory contains 50+ optimized analytical SQL queries spanning basic aggregations, complex joins, window functions, and CTEs. These queries represent the core of the analytics engine and can be used directly in tools like pgAdmin or Metabase.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
