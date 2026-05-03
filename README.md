# Steflow Store Server

Backend server for Steflow Store built with Node.js, Express, TypeScript, and Supabase.

## Features

- 🔐 **Authentication**: Secure authentication with Supabase Auth.
- 🗄️ **Supabase Database**: Scalable PostgreSQL database integration.
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
- Supabase project

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
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
├── config/
│   ├── env.ts           # Environment variable validation
│   └── supabase.ts      # Supabase client connection
├── controllers/
│   ├── admin/           # Admin-specific controllers (analytics, products, orders, etc.)
│   ├── addressController.ts
│   ├── cartController.ts
│   ├── orderController.ts
│   ├── productController.ts
│   ├── profileController.ts
│   ├── uploadController.ts
│   └── wishlistController.ts
├── middleware/
│   ├── auth.ts          # Authentication & authorization middleware
│   ├── cors.ts          # CORS middleware
│   ├── errorHandler.ts  # Error handling middleware
│   └── notFound.ts      # 404 handler
├── routes/
│   ├── v1/              # API v1 routes
│   │   ├── admin/
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── profile.ts
│   │   └── upload.ts
│   └── index.ts         # Main router
├── services/
│   └── authService.ts   # Authentication helper services
├── types/
│   └── index.ts         # TypeScript type definitions
└── index.ts             # Express app entry point
```

## API Documentation

The API documentation is available at `/api/docs` when the server is running.
