# CodeRank Backend

## 🚀 Project Overview

CodeRank is an online code execution platform built for running user-submitted code through a backend API. It supports multiple programming languages including JavaScript, Python, Java, C, C++, Ruby, Go, Rust. The backend uses Docker-based/containerized execution to isolate programs from the host system. It also handles secure execution with timeout protection, rate limiting, validation, and structured error handling.

## 🔗 Live Deployment Links

- **Frontend Deployment Link:** [https://coderuns.vercel.app/](https://coderuns.vercel.app/)
- **Backend API Link:** [https://coderunsapi.duckdns.org/](https://coderunsapi.duckdns.org/)

## 📦 GitHub Repository Links

- **Frontend Repository:** [https://github.com/Sharifa26/coderank_frontend.git](https://github.com/Sharifa26/coderank_frontend.git)
- **Backend Repository:** [https://github.com/Sharifa26/codeRank_backend.git](https://github.com/Sharifa26/codeRank_backend.git)

## ✨ Features

- Multi-language code execution
- Real-time output streaming with Socket.IO
- Standard input support for interactive programs
- Structured API responses and error handling
- Timeout protection for long-running code
- Docker isolation for safer execution
- REST API architecture for auth, saved code, sharing, and history
- AI/code optimization endpoint support
- Rate limiting for authentication and execution routes

## 🛠 Tech Stack

- **Frontend:** React / Next.js or your deployed frontend client
- **Backend:** Node.js, TypeScript, Express.js, Socket.IO
- **Database:** MongoDB with Mongoose
- **Docker:** Docker Desktop, Dockerode, custom `coderank-executor` image
- **Deployment:** AWS EC2 backend deployment with environment-based configuration

## ✅ Prerequisites

Install the following software before running the project:

- Node.js 18 or later
- npm or yarn
- Docker Desktop
- Git
- MongoDB local instance or MongoDB Atlas connection string

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Sharifa26/codeRank_backend.git
cd codeRank_backend
```

### 2. Install Dependencies

Using npm:

```bash
npm install
```

Using yarn:

```bash
yarn install
```

### 3. Setup Environment Variables

Create a `.env` file in the backend root directory:

```bash
cp .env.example .env
```

If `.env.example` is not available, create `.env` manually using the backend format shown below.

### 4. Build Docker Executor Image

Make sure Docker Desktop is running, then build the code execution image:

```bash
npm run docker:build
```

This creates the `coderank-executor` image used to run submitted code inside containers.

### 5. Run Backend

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

By default, the backend runs at:

```text
http://localhost:5000
```

### 6. Run Frontend

The frontend should be started from the separate frontend repository:

```bash
git clone https://github.com/Sharifa26/coderank_frontend.git
cd coderank_frontend
npm install
npm run dev
```

### 7. Run Docker Services

Docker Desktop must stay open while executing code. The backend connects to Docker through the Docker socket and runs submitted programs inside short-lived containers.

```bash
npm run docker:build
npm run dev
```

## 🔐 Environment Variables

### Backend `.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/coderank

JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d

DOCKER_SOCKET=/var/run/docker.sock
EXECUTION_TIMEOUT=10000
MEMORY_LIMIT=256m
CPU_LIMIT=0.5
MAX_QUEUE_SIZE=100

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

FRONTEND_URL=http://localhost:3000
FRONTEND_URLS=http://localhost:3000
BACKEND_URL=http://localhost:5000
COOKIE_DOMAIN=

GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="CodeRank <your_email@gmail.com>"
```

### Frontend `.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Update these values based on the actual frontend framework and deployment URLs.

## 📡 API Endpoints

Refer to the [API Documentation](API_DOCUMENTATION.md) for detailed information on each endpoint.

### Health

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Check backend server health |

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/signup` | Register a new user |
| POST | `/api/v1/auth/login` | Login with email and password |
| POST | `/api/v1/auth/google` | Login with Google |
| GET | `/api/v1/auth/me` | Get current authenticated user |
| POST | `/api/v1/auth/logout` | Logout current user |
| POST | `/api/v1/auth/forgot-password` | Request password reset email |
| POST | `/api/v1/auth/reset-password` | Reset password using token |

### Code Management

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/code/save` | Save a code snippet |
| GET | `/api/v1/code/history` | Get authenticated user's saved code history |
| GET | `/api/v1/history` | Get authenticated user's code history |
| GET | `/api/v1/code/:id` | Get a specific saved code snippet |
| POST | `/api/v1/code/share` | Generate a public share link |
| GET | `/api/v1/code/shared/:shareId` | View shared code without authentication |
| POST | `/api/v1/code/optimize` | Optimize code and return suggestions |
| DELETE | `/api/v1/code/delete/:id` | Delete a saved code snippet |

### Real-Time Code Execution

Code execution is handled through Socket.IO events after authentication.

| Event | Direction | Purpose |
| --- | --- | --- |
| `execution:start` | Client to server | Start code execution |
| `execution:stdin` | Client to server | Send live input to running program |
| `execution:stop` | Client to server | Stop active execution |
| `execution:status` | Server to client | Send execution status updates |
| `execution:output` | Server to client | Stream stdout/stderr output |
| `execution:complete` | Server to client | Send final execution result |
| `execution:error` | Server to client | Send execution error message |

## 📁 Folder Structure

```text
coderank-backend/
├── docker/
│   └── Dockerfile.executor      # Docker image for sandboxed execution
├── src/
│   ├── config/                  # Environment, database, Docker, mail config
│   ├── controllers/             # Request handlers
│   ├── middlewares/             # Auth, validation, rate limiting, errors
│   ├── models/                  # MongoDB/Mongoose models
│   ├── routes/                  # REST API routes
│   ├── services/                # Business logic and execution services
│   ├── socket/                  # Socket.IO execution events
│   ├── types/                   # TypeScript types and enums
│   ├── utils/                   # Shared helpers and response classes
│   └── validators/              # Joi validation schemas
├── Dockerfile                   # Backend container file
├── package.json                 # Scripts and dependencies
└── tsconfig.json                # TypeScript configuration
```

Frontend structure is maintained in the separate frontend repository and typically contains pages/components, API client utilities, editor UI, and deployment configuration.

## Difficulties Faced While Building the Project
- Understanding and configuring Docker and Docker Compose.
- Executing code interactively using exec and spawn commands, especially handling real-time input and output.
- Deploying the project on DigitalOcean, as I was unable to claim the available credits.
- Unable to claim the required credentials for domain from github students pack and configuring a custom domain name.


## Solutions Implemented
- Learned and configured Docker and Docker Compose properly for containerized development and deployment.
- Used Socket.IO to establish real-time communication between the frontend and backend for interactive code execution.
- Deployed the project on AWS EC2 instead of DigitalOcean.
- Used alternative deployment and hosting configurations until the domain setup issue was resolved.

## 🛡 Security Features

- **Docker sandboxing:** User code runs inside isolated containers instead of directly on the host.
- **Rate limiting:** Authentication, general API, and execution requests are limited to reduce abuse.
- **Timeout handling:** Long-running programs are stopped automatically.
- **Input validation:** Request payloads are validated with Joi schemas.
- **Authentication middleware:** Protected routes require a valid user session/token.
- **Security headers:** Helmet is used to add safer HTTP response headers.
- **Resource limits:** Memory, CPU, queue size, and input/code size limits are configured.

## 🧭 Future Improvements

- Add more programming languages and version selection
- Add role-based authentication and admin controls
- Store detailed execution history and analytics
- Add AI-powered code analysis and debugging feedback
- Add test case runner support for coding challenges
- Add container metrics and observability dashboards

## 👤 Author

**Sharifa**

- Project: CodeRank Backend Engineering Case Study
- Role: Backend Developer
- GitHub: [https://github.com/Sharifa26](https://github.com/Sharifa26)
- LinkedIn: [https://www.linkedin.com/in/sharifa-sheriff/](https://www.linkedin.com/in/sharifa-sheriff/)
