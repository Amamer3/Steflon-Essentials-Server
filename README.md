# Steflow Store Server

Backend server for Steflow Store built with Node.js, Express, TypeScript, BetterAuth, and Firestore.

## Features

- 🔐 **Authentication**: Secure authentication with BetterAuth using a custom Firestore adapter.
- 🗄️ **Firestore Database**: Scalable NoSQL database integration.
- 🛍️ **Product Management**: Full CRUD operations for products with filtering, sorting, and pagination.
- 👤 **User Profiles**: User profile management and password updates.
- 📊 **Admin Analytics**: Dashboard stats, revenue analytics, and customer insights.
- 📝 **TypeScript**: Fully typed codebase for reliability and maintainability.
- 🚀 **Express.js REST API**: Robust and scalable API architecture.
- ✅ **Validation**: Environment variable and request validation using Zod.
- 🛡️ **Security**: CORS configuration, error handling, and secure headers.
- 📄 **API Documentation**: Interactive API docs with Scalar.

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

2. Set up your `.env` file with the required credentials.

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
├── adapters/
│   └── firestore.ts     # Custom Firestore adapter for BetterAuth
├── config/
│   ├── auth.ts          # BetterAuth configuration
│   ├── env.ts           # Environment variable validation
│   └── firestore.ts     # Firestore connection
├── controllers/
│   ├── admin/           # Admin-specific controllers (analytics, profiles)
│   ├── productController.ts
│   ├── profileController.ts
│   └── uploadController.ts
├── middleware/
│   ├── auth.ts          # Authentication & authorization middleware
│   ├── cors.ts          # CORS middleware
│   ├── errorHandler.ts  # Error handling middleware
│   └── notFound.ts      # 404 handler
├── routes/
│   ├── v1/              # API v1 routes
│   │   ├── admin.ts
│   │   ├── products.ts
│   │   ├── profile.ts
│   │   └── upload.ts
│   └── index.ts         # Main router
├── services/
│   └── authService.ts   # Authentication services
├── types/
│   └── index.ts         # TypeScript type definitions
└── index.ts             # Express app entry point
```

## API Documentation

Interactive API documentation is available using Scalar at:
- **Development**: `http://localhost:3000/api/docs`

The documentation includes all endpoints, request/response schemas, and allows you to test API calls directly from the browser.

## API Endpoints

### Authentication
All authentication endpoints are handled by BetterAuth at `/api/auth/*`.

### Products (`/api/v1/products`)
- `GET /` - Get all products (supports pagination, filtering, sorting)
- `GET /:id` - Get a single product
- `GET /featured` - Get featured products
- `GET /bestsellers` - Get bestseller products
- `GET /categories` - Get product categories

### User Profile (`/api/v1/profile`)
- `GET /` - Get current user profile
- `PATCH /` - Update user profile
- `POST /change-password` - Initiate password change

### Admin (`/api/v1/admin`)
- `GET /analytics/dashboard` - Get dashboard stats
- `GET /analytics/revenue` - Get revenue analytics
- `GET /analytics/orders` - Get order analytics
- `GET /analytics/products` - Get product performance
- `GET /analytics/customers` - Get customer insights
- `GET /profile` - Get admin profile
- `PATCH /profile` - Update admin profile

### Upload (`/api/v1/upload`)
- `POST /image` - Upload a single product image
- `POST /images` - Upload multiple product images

### Health Check
- `GET /api/health` - Server health check

## License

ISC

