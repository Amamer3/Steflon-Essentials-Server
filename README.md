# Steflow Store Server

Backend server for Steflow Store built with Node.js, Express, TypeScript, BetterAuth, and Firestore.

## Features

- 🔐 Authentication with BetterAuth
- 🗄️ Firestore database integration
- 📝 TypeScript for type safety
- 🚀 Express.js REST API
- ✅ Environment variable validation
- 🛡️ CORS configuration
- 📦 Error handling middleware

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore enabled
- BetterAuth credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# BetterAuth
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# Firestore
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your `.env` file with the required credentials

3. Run the development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run type-check` - Type check without building

## Project Structure

```
src/
├── config/
│   ├── auth.ts          # BetterAuth configuration
│   ├── env.ts           # Environment variable validation
│   └── firestore.ts     # Firestore connection
├── middleware/
│   ├── cors.ts          # CORS middleware
│   ├── errorHandler.ts  # Error handling middleware
│   └── notFound.ts      # 404 handler
├── routes/
│   └── index.ts         # API routes
└── index.ts             # Express app entry point
```

## API Documentation

Interactive API documentation is available using Scalar at:
- **Development**: `http://localhost:5000/api/docs`

The documentation includes all endpoints, request/response schemas, and allows you to test API calls directly from the browser.

## API Endpoints

### Authentication
All authentication endpoints are handled by BetterAuth at `/api/auth/*`

### Health Check
- `GET /api/health` - Server health check

### API Versioning
All API endpoints are versioned under `/api/v1/*`

For complete API documentation, visit `/api/docs` when the server is running.

## Development

The server runs on `http://localhost:3000` by default. The BetterAuth endpoints will be available at `http://localhost:3000/api/auth/*`.

## License

ISC

