# Lemenbado

**Lemenbado** is a freight-matching platform for truck owners and cargo owners in Ethiopia.

The platform helps truck owners find cargo for available space—especially on return journeys—and helps cargo owners find trucks already traveling toward their destination. By connecting suitable trucks and loads, Lemenbado aims to reduce empty truck trips, improve transport efficiency, and simplify freight coordination.

## Live application

Visit the deployed web application:

**[https://lemenbado.vercel.app/](https://lemenbado.vercel.app/)**

## How Lemenbado works

```mermaid
flowchart LR
    A[Truck owner lists route and capacity] --> C[Lemenbado matching]
    B[Cargo owner posts shipment details] --> C
    C --> D[Potential matches]
    D --> E[Booking and contact exchange]
    E --> F[Transportation completed]
    F --> G[Reviews and ratings]
```

1. A truck owner publishes a route and available capacity, or a cargo owner posts a shipment.
2. Lemenbado finds compatible routes, cargo, truck types, capacity, and timing.
3. Users review a match and create a booking.
4. The parties coordinate transportation and can leave reviews after the booking.

## Main features

- User registration, login, password recovery, and authentication
- Truck and truck-type management
- Cargo and cargo-type management
- Truck availability publishing
- Route and city management
- Cargo-to-truck matching
- Booking management
- Reviews and ratings
- Document upload and administration
- Admin tools for managing platform data
- Automatic expiry handling for outdated availability and cargo records
- Responsive web interface
- Progressive Web App manifest and installable app icons

## System architecture

```mermaid
flowchart TB
    User[Truck owners and cargo owners] --> Web[Web application\nHTML, CSS, JavaScript]
    Web --> API[Express REST API\nTypeScript]
    API --> Auth[JWT authentication]
    API --> Validation[Zod request validation]
    API --> Supabase[Supabase\nPostgreSQL and storage]
    API --> Jobs[Expiry sweep\nstartup + every 5 minutes]
```

## Repository structure

The repository is organized into a frontend application and a backend API:

```text
lemenbado/
├── .gitignore
├── README.md
│
├── api/                                      # Backend REST API
│   ├── .env.example                          # Required environment variables template
│   ├── README.md                              # Backend documentation
│   ├── package.json                            # Backend scripts and dependencies
│   ├── package-lock.json                       # Locked npm dependency versions
│   ├── tsconfig.json                           # TypeScript compiler configuration
│   │
│   └── src/
│       ├── index.ts                            # Express app, routes, CORS, health check, startup jobs
│       │
│       ├── lib/                                # Shared infrastructure and utilities
│       │   ├── env.ts                           # Environment configuration
│       │   ├── expiry.ts                        # Expired-record cleanup logic
│       │   └── supabase.ts                      # Supabase client setup
│       │
│       ├── middleware/                          # Express middleware
│       │   ├── auth.ts                          # Authentication middleware
│       │   └── errorHandler.ts                  # Centralized API error handling
│       │
│       └── modules/                             # Feature-based API modules
│           ├── admin/
│           │   ├── admin.routes.ts              # Admin endpoints
│           │   ├── admin.service.ts             # Admin business logic
│           │   └── documents.service.ts         # Administrative document operations
│           │
│           ├── auth/
│           │   ├── auth.routes.ts               # Registration, login, and password routes
│           │   ├── auth.schema.ts               # Authentication validation schemas
│           │   └── auth.service.ts              # Authentication business logic
│           │
│           ├── availability/
│           │   ├── availability.routes.ts       # Truck availability endpoints
│           │   ├── availability.schema.ts       # Availability validation schemas
│           │   └── availability.service.ts      # Availability business logic
│           │
│           ├── bookings/
│           │   ├── bookings.routes.ts            # Booking endpoints
│           │   ├── bookings.schema.ts            # Booking validation schemas
│           │   └── bookings.service.ts           # Booking business logic
│           │
│           ├── cargo/
│           │   ├── cargo-types.routes.ts         # Cargo-type endpoints
│           │   ├── cargo.routes.ts               # Cargo endpoints
│           │   ├── cargo.schema.ts               # Cargo validation schemas
│           │   └── cargo.service.ts              # Cargo business logic
│           │
│           ├── cities/
│           │   └── cities.routes.ts              # City and route lookup endpoints
│           │
│           ├── documents/
│           │   └── documents.routes.ts           # Document endpoints
│           │
│           ├── matching/
│           │   ├── matching.routes.ts            # Matching endpoints
│           │   └── matching.service.ts           # Truck and cargo matching logic
│           │
│           ├── reviews/
│           │   ├── reviews.routes.ts             # Review endpoints
│           │   └── reviews.service.ts            # Review business logic
│           │
│           └── trucks/
│               ├── truck-types.routes.ts         # Truck-type endpoints
│               ├── trucks.routes.ts              # Truck endpoints
│               ├── trucks.schema.ts              # Truck validation schemas
│               └── trucks.service.ts             # Truck business logic
│
└── web/                                       # Frontend web application and PWA
    ├── index.html                             # Landing page
    ├── manifest.webmanifest                   # Progressive Web App metadata
    │
    ├── assets/
    │   └── icons/
    │       ├── icon-192.png                   # PWA icon
    │       └── icon-512.png                   # Large PWA icon
    │
    ├── css/
    │   ├── components.css                     # Reusable UI components
    │   ├── globals.css                        # Global styles and layout
    │   └── tokens.css                         # Design tokens and theme values
    │
    ├── js/
    │   └── app.js                             # Shared frontend application logic
    │
    └── pages/                                  # Application screens
        ├── admin.html                          # Administration screen
        ├── booking-detail.html                 # Booking details
        ├── bookings.html                       # User bookings
        ├── dashboard.html                      # User dashboard
        ├── forgot-password.html                # Password recovery request
        ├── login.html                           # Login
        ├── matches.html                         # Matching results
        ├── post-cargo.html                      # Post a cargo request
        ├── profile.html                         # User profile
        ├── publish-availability.html            # Publish truck availability
        ├── register.html                        # Account registration
        └── reset-password.html                  # Reset password
```

## Technology stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Progressive Web App support
- Responsive layout for desktop and mobile devices

### Backend

- Node.js
- Express
- TypeScript
- Supabase and PostgreSQL
- JWT authentication
- Zod validation
- CORS
- Multer for file uploads

## Run the project locally

### Prerequisites

- Node.js 20 or later recommended
- npm
- A Supabase project for database and storage services

### Start the API

```bash
cd api
npm install
cp .env.example .env
```

Update `.env` with the values from your Supabase project, then start the development server:

```bash
npm run dev
```

The API runs on `http://localhost:4000` by default. Its health endpoint is:

```text
http://localhost:4000/health
```

### Available API scripts

```bash
npm run dev      # Start the API with automatic reloads
npm run build    # Compile TypeScript to JavaScript
npm start        # Start the compiled API
npm run test:db  # Test the database connection
```

### Open the frontend

The frontend is a static application. Serve the `web/` directory with a local web server so that page navigation and browser requests work correctly. For example:

```bash
cd web
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500/
```

Set `FRONTEND_ORIGIN` in `api/.env` to the URL where the frontend is running.

## Environment variables

The backend reads configuration from `api/.env`:

```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://user:password@host:5432/postgres"
PORT=4000
FRONTEND_ORIGIN="http://localhost:5500"
```

Never commit real credentials or service-role keys. Use `.env.example` as the configuration template.

## API route groups

The API is grouped by feature under `/api`:

```text
/api/auth
/api/cities
/api/trucks
/api/truck-types
/api/truck-availability
/api/cargo
/api/cargo-types
/api/matches
/api/bookings
/api/admin
/api/documents
/api/reviews
```

The `GET /health` endpoint can be used to check whether the API is running.

## Deployment

The live web application is deployed on Vercel:

**[https://lemenbado.vercel.app/](https://lemenbado.vercel.app/)**

The backend API requires its own deployment and environment configuration. When deploying the API, configure the Supabase credentials, `PORT`, and the production `FRONTEND_ORIGIN` value in the hosting provider's environment settings.

## Project status

Lemenbado is actively under development. The platform is being improved with additional features, usability updates, and production-readiness work.

## License

No open-source license has been specified yet.
