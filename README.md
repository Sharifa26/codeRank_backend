# CodeRank Backend

Simple backend service for the CodeRank project. This API handles:

- user authentication
- code execution requests
- code save/share/history features
- code optimization requests

The project is built with `Node.js`, `TypeScript`, `Express`, `MongoDB`, and optional `Docker` for isolated code execution.

## Prerequisites

Install these tools before running the project:

- `Node.js` 18 or later
- `npm`
- `MongoDB` local or cloud database
- `Docker Desktop` if you want real code execution in containers

If Docker is not available, the app still starts, but code execution will run in fallback mode.

## Installation

1. Clone the project.
2. Open the backend folder:

```bash
cd coderank-backend
```

3. Install dependencies:

```bash
npm install
```

## Environment Setup

Create a `.env` file in the project root.

Example:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/coderank
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d
DOCKER_SOCKET=/var/run/docker.sock
EXECUTION_TIMEOUT=10000
MEMORY_LIMIT=64m
CPU_LIMIT=0.5
MAX_QUEUE_SIZE=100
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
SMTP_FROM="CodeRank <your_email@gmail.com>"

## How To Run

## Docker Setup For Code Execution

This project uses a custom Docker image called `coderank-executor` for running user code safely inside containers.

Build the executor image:

```bash
npm run docker:build
```

If this image is not built, the backend will still run, but code execution will be simulated in fallback mode.

### Development mode

Run to build and start the server:

```bash
npm run build
```

Start the compiled server:

```bash
npm start
```

```bash
npm run dev
```

This starts the server with `ts-node-dev`.

## Default Server URL

When running locally, the API starts at:

```text
http://localhost:5000
```

Health check endpoint:

```text
GET /api/v1/health
```

## Available Scripts

- `npm run dev` - run in development mode
- `npm run build` - compile TypeScript to `dist`
- `npm start` - run compiled app from `dist/app.js`
- `npm run lint` - run ESLint
- `npm run docker:build` - build Docker executor image

## Main API Routes

### Auth

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/forgot-password`

### Code

- `POST /api/v1/code/run`
- `POST /api/v1/code/save`
- `GET /api/v1/code/history`
- `GET /api/v1/code/:id`
- `POST /api/v1/code/share`
- `GET /api/v1/code/shared/:shareId`
- `POST /api/v1/code/optimize`

### Other

- `GET /api/v1/history`
- `GET /api/v1/health`

## Project Structure

```text
src/
  config/         configuration files
  controllers/    request handlers
  middlewares/    auth, validation, rate limit, error handling
  models/         mongoose models
  routes/         API route definitions
  services/       business logic and Docker execution
  utils/          helpers and shared utilities
  validators/     Joi validation schemas
docker/
  Dockerfile.executor
```

## Notes

- MongoDB connection is required for the app to start.
- In production, set a strong `JWT_SECRET`.
- Docker is recommended if you want real code execution support.
- There is currently no dedicated test script in `package.json`.
