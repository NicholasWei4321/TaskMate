# TaskMate

TaskMate is an AI-enhanced task management application with intelligent prioritization and external assignment synchronization. It is built using concept-based design patterns with a Deno backend and Vue.js frontend.

## Additional Documents
[Final Design Document](docs/final-design.md) | [Reflections](docs/reflection.md) | [Console Log](docs/backend-logs.txt)

See the final user journey [here](https://youtu.be/8ZAohbe3wXg).

## Features

- **AI-Powered Task Prioritization**: Automatically infers task effort, importance, and difficulty using Gemini LLM
- **Smart Lists**: Recurring daily/weekly/monthly lists with automatic time-based task filtering
- **External Sync**: Canvas LMS integration for automatic assignment import
- **Session-Based Authentication**: Secure user authentication with credential storage

## [Important] Setup

### Render Deployment

The backend service spins down with inactivity, so make sure to first visit [https://taskmate-backend-kfiq.onrender.com/](https://taskmate-backend-kfiq.onrender.com/) to make sure that the backend is running.

Afterward, visit [https://taskmate-eyku.onrender.com](https://taskmate-backend-kfiq.onrender.com/) to use TaskMate!

### Local Development

To set up the backend, make sure you fill in these environment variables:
```bash
# Set environment variables
export MONGODB_URL="your-mongodb-atlas-uri"
export GEMINI_API_KEY="your-gemini-api-key"

# Start server (localhost:8000)
deno task start
```

To start the front end, do the following:
```bash
# Install dependencies
npm install

# Start dev server (localhost:5173)
npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:8000` (configured in `vite.config.js`).

## Directory Structure

```
TaskMate/
├── src/
│   ├── concepts/           # Core concept implementations
│   │   ├── AIPrioritizedTask/
│   │   ├── TodoList/
│   │   ├── UserAuthentication/
│   │   ├── ExternalAssignmentSync/
│   │   └── Requesting/     # Synchronization engine
│   ├── syncs/              # Synchronization patterns
│   ├── engine/             # Request processing engine
│   └── main.ts             # Server entry point
├── design/                 # Design documentation
├── Dockerfile              # Container configuration
└── deno.json              # Deno configuration
```