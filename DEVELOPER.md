# Alerte-Secours Services - Developer Documentation

This document contains technical information for developers working on the Alerte-Secours microservices backend.

## Development Quick Start

### Requirements

- Docker
- Devbox
- Android SDK (for mobile development)
- Java 8+ (for Android development)

### Installation

1. Clone the repository:
```sh
git clone https://codeberg.org/alerte-secours/alerte-secours
cd alerte-secours
```

2. Install devbox if not already installed:
```sh
curl -fsSL https://get.jetpack.io/devbox | bash
```

3. Enter devbox shell (this will automatically install Node.js 24 and Yarn 4.10.3):
```sh
devbox shell
```

4. Install dependencies:
```sh
yarn
```

5. Set up environment variables:
```sh
cp .env.default .env
```

### Start Services

Start all services with Tilt:
```sh
yarn dev
# or
devbox run dev
# or run a subset of services:
tilt up api files hasura
```

View logs in Tilt UI (web HUD opens automatically). CLI alternative:
```sh
yarn dev:logs
# or
tilt logs
```

Stop services:
```sh
# If running in the foreground terminal:
Ctrl-C
# Or explicitly:
tilt down
```

Compose fallback (legacy):
```sh
yarn compose:up
yarn compose:down
# or via devbox:
devbox run compose:up
devbox run compose:down
```

### Using Devbox

Once you're in the devbox shell, you have access to:
- Node.js 24 (automatically installed)
- Yarn 4.6.0 (automatically installed)
- All project scripts and environment variables
- PostgreSQL client tools

To exit the devbox shell:
```sh
exit
```

To run commands from outside the shell:
```sh
devbox run <command>
```

Available devbox scripts:
- `devbox run dev` - Start development environment
- `devbox run dev:up` - Start all services
- `devbox run dev:logs` - View development logs
- `devbox run console` - Open development console

### Public Staging Environment

For development and testing, you can use our public staging environment:

- API: https://api-staging.alerte-secours.fr
- GraphQL: https://graphql-staging.alerte-secours.fr
- Web Interface: https://web-staging.alerte-secours.fr

### Endpoints (Local Development)

#### Services
- API: http://localhost:4200
- Files: http://localhost:4292
- Hasura: http://localhost:4201
- Tasks Service
- Watchers Service
- Web: http://localhost:4203

#### Consoles
- [Hasura Console](http://localhost:4295)
- [Minio Console](http://localhost:4291)
- [API Swagger](http://localhost:4200/api/v1/swagger/)
- [API GraphQL](http://localhost:4200/api/v1/graphql)
- [Files API](http://localhost:4292/api/v1/swagger/)

#### API URLs
- `/api/v1`
  - `/spec` - API Specification
  - `/oas` - OpenAPI Service
  - `/swagger` - Swagger Documentation
  - `/graphql` - GraphQL Endpoint
- `/status` - Service Status
- `/` - Root Endpoint

## Technical Stack

### Backend
- **Node.js** (>=22) - Core runtime
- **PostgreSQL** - Primary database
- **Redis** - Caching and queue deduplication
- **RabbitMQ** - Message queue
- **Hasura** - GraphQL engine
- **OpenAPI** - API specification and documentation
- **Modjo Framework** - Microservices architecture

### Frontend
- **React** - Web interface
- **React Native** - Mobile application
- **Apollo Client** - GraphQL integration
- **MapView** - Geolocation visualization

### Infrastructure
- **Docker** - Containerization
- **Microservices Architecture** - Separate services for API, files, tasks, etc.
- **CQRS Pattern** - Command Query Responsibility Segregation
- **Event-Driven Architecture** - Using message queues

### Key Features
- Real-time alerts and notifications
- Geolocation tracking and mapping
- Emergency services integration
- User authentication and authorization
- File storage and management
- Background task processing

## Project Structure

```
services/
├── api/          # Main API service
├── app/          # Frontend application
├── files/        # File handling service
├── hasura/       # GraphQL engine
├── tasks/        # Background task processing
├── watchers/     # Event monitoring
└── web/          # Web interface

libs/
├── common/       # Shared utilities
├── postgres-types/ # Database type definitions
├── redis-queue-dedup/ # Redis queue deduplication
└── utils/        # General utilities
```

## Contributing

We welcome contributions to Alerte-Secours. Please read our contribution guidelines before submitting pull requests.

## Support

For technical support, please open an issue on our [Codeberg issue tracker](https://codeberg.org/alerte-secours/alerte-secours/-/issues) or [GitHub issue tracker](https://github.com/alerte-secours/alerte-secours/issues).
