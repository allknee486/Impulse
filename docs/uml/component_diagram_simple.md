## Component Diagram

```mermaid
graph TB
    subgraph User_Layer["User"]
        Browser[Web Browser]
    end

    subgraph Frontend["Frontend --- React SPA"]
        Pages[Pages<br/>Dashboard, Transactions,<br/>Budget, Analytics]
        AuthContext[Auth Context<br/>JWT Token Management]
        APIClient[API Client<br/>Axios + Interceptors]
    end

    subgraph Backend["Backend - Django"]
        REST[REST API<br/>ViewSets & Serializers]
        Auth[JWT Authentication]
        WebSocket[WebSocket<br/>Real-time Updates]
        Models[Models<br/>ORM Layer]
    end

    subgraph Database["Database"]
        PostgreSQL[(PostgreSQL<br/>User, Budget,<br/>Transaction, etc.)]
    end

    %% Connections
    Browser -->|HTTPS| Pages
    Browser -.->|WebSocket| WebSocket

    Pages --> AuthContext
    Pages --> APIClient
    APIClient -->|HTTP + JWT| REST

    REST --> Auth
    REST --> Models
    WebSocket --> Models
    Models --> PostgreSQL

    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef data fill:#f1f8e9,stroke:#689f38,stroke-width:2px

    class Pages,AuthContext,APIClient frontend
    class REST,Auth,WebSocket,Models backend
    class PostgreSQL data
```

## Architecture Overview

The Impulse application uses a **3-tier architecture**:

### Frontend Layer
- **React SPA** with React Router for navigation
- **Auth Context** manages user state and JWT tokens
- **API Client** handles all HTTP requests with automatic token refresh

###  Backend Layer
- **Django REST Framework** provides RESTful API endpoints
- **JWT Authentication** secures all API calls
- **WebSocket** enables real-time transaction updates
- **Django ORM** manages database operations

###  Data Layer
- **PostgreSQL** stores all user data
- Tables: User, Category, Budget, Transaction, SavingsGoal, etc.

### Data Flow

**HTTP Request:** Browser → React → Axios (+ JWT) → Django REST API → Database

**WebSocket:** Transaction saved → Django Signal → WebSocket → All connected clients