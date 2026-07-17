# RetailIQ System Architecture

```mermaid
graph TD
    %% Define styles
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef backend fill:#bbf,stroke:#333,stroke-width:2px;
    classDef data fill:#dfd,stroke:#333,stroke-width:2px;
    classDef ml fill:#ffd,stroke:#333,stroke-width:2px;

    %% Client Layer
    subgraph Client Layer
        ReactApp[React Frontend\n(Vite, Tailwind, Recharts)]:::client
    end

    %% Backend Layer
    subgraph Backend API Layer
        FastAPI[FastAPI Server]:::backend
        Auth[JWT Auth]:::backend
        WS[WebSocket Manager]:::backend
        API[CRUD Endpoints]:::backend
        
        FastAPI --> Auth
        FastAPI --> WS
        FastAPI --> API
    end

    %% Data Layer
    subgraph Database Layer
        SQLite[(SQLite/PostgreSQL)]:::data
        Triggers[Audit Triggers]:::data
        
        SQLite --- Triggers
    end

    %% Analytics Layer
    subgraph Data Science & Analytics Layer
        Pandas[Pandas Data Processing]:::ml
        Scipy[Scipy Statistics]:::ml
        Prophet[FB Prophet Forecasting]:::ml
        RecEngine[Recommendation Engine]:::ml
    end

    %% Connections
    ReactApp <-->|HTTP/REST| FastAPI
    ReactApp <-->|WebSockets| WS
    
    API <-->|SQLAlchemy ORM| SQLite
    
    Pandas -->|Read CSV/DB| SQLite
    Scipy --> Pandas
    Prophet --> Pandas
    RecEngine --> Pandas
    
    API -.->|Serve ML Results| Pandas
```
