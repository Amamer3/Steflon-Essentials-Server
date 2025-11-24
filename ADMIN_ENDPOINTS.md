# Admin API Endpoints

This document provides an overview of all implemented admin endpoints in the Steflow Store Server.

## Authentication

### Admin Sign In
- **POST** `/api/v1/admin/auth/sign-in`
- **Description**: Admin login with role verification
- **Body**: `{ email, password }`
- **Response**: Session cookie + user data
- **Note**: Validates that the user has admin role before allowing sign-in

### Create Admin User
- **POST** `/api/v1/admin/auth/create-admin`
- **Description**: Create a new admin user account
- **Body**: `{ email, password, name? }`
- **Response**: Created admin user data
- **Note**: 
  - For initial setup, this endpoint can be called without authentication
  - In production, you should protect this endpoint to only allow existing admins to create new admins
  - Uses BetterAuth for secure password hashing
  - Validates email format and password strength (min 8 characters)

### Get Current Admin
- **GET** `/api/v1/admin/auth/me`
- **Description**: Get authenticated admin profile
- **Auth**: Required (Admin)
- **Response**: Admin user profile

## Dashboard

### Dashboard Statistics
- **GET** `/api/v1/admin/dashboard/stats`
- **Description**: Get key performance indicators with percentage changes
- **Auth**: Required (Admin)
- **Query Params**: `timeRange` (7days, 30days, 90days, 1year, all)
- **Response**: 
  - `totalOrders`, `totalCustomers`, `totalProducts`, `revenue`
  - `ordersChange`, `customersChange`, `productsChange`, `revenueChange`

### Recent Orders
- **GET** `/api/v1/admin/dashboard/recent-orders`
- **Description**: Get most recent orders
- **Auth**: Required (Admin)
- **Query Params**: `limit` (default: 10)
- **Response**: Array of recent orders

## Product Management

### Get All Products
- **GET** `/api/v1/admin/products`
- **Description**: Get all products with advanced filtering
- **Auth**: Required (Admin)
- **Query Params**: `page`, `limit`, `category`, `status`, `search`
- **Response**: Paginated product list

### Get Single Product
- **GET** `/api/v1/admin/products/:id`
- **Description**: Get detailed product information
- **Auth**: Required (Admin)
- **Response**: Product details

### Create Product
- **POST** `/api/v1/admin/products`
- **Description**: Create a new product
- **Auth**: Required (Admin)
- **Body**: Product data (name, description, price, etc.)
- **Response**: Created product with ID

### Update Product
- **PUT** `/api/v1/admin/products/:id`
- **Description**: Update existing product
- **Auth**: Required (Admin)
- **Body**: Updated product fields
- **Response**: Updated product

### Delete Product (Soft Delete)
- **DELETE** `/api/v1/admin/products/:id`
- **Description**: Soft delete product (sets status to 'Deleted')
- **Auth**: Required (Admin)
- **Response**: Success message

### Update Product Stock
- **PUT** `/api/v1/admin/products/:id/stock`
- **Description**: Update product stock quantity
- **Auth**: Required (Admin)
- **Body**: `{ stock: number }`
- **Response**: Success message

### Update Product Status
- **PUT** `/api/v1/admin/products/:id/status`
- **Description**: Update product status
- **Auth**: Required (Admin)
- **Body**: `{ status: 'Active' | 'Inactive' | 'OutOfStock' | 'Deleted' }`
- **Response**: Success message

## Order Management

### Get All Orders
- **GET** `/api/v1/admin/orders`
- **Description**: Get all orders with filtering
- **Auth**: Required (Admin)
- **Query Params**: `page`, `limit`, `status`, `search`, `dateFrom`, `dateTo`
- **Response**: Paginated order list

### Get Single Order
- **GET** `/api/v1/admin/orders/:id`
- **Description**: Get detailed order information
- **Auth**: Required (Admin)
- **Response**: Order details

### Update Order Status
- **PUT** `/api/v1/admin/orders/:id/status`
- **Description**: Update order status
- **Auth**: Required (Admin)
- **Body**: `{ status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded' }`
- **Response**: Success message

### Export Orders
- **GET** `/api/v1/admin/orders/export`
- **Description**: Export orders (currently returns JSON, CSV/Excel to be implemented)
- **Auth**: Required (Admin)
- **Query Params**: `format`, `status`, `dateFrom`, `dateTo`
- **Response**: Order data

## Customer Management

### Get All Customers
- **GET** `/api/v1/admin/customers`
- **Description**: Get all customers with filtering
- **Auth**: Required (Admin)
- **Query Params**: `page`, `limit`, `search`, `status`
- **Response**: Paginated customer list

### Get Single Customer
- **GET** `/api/v1/admin/customers/:id`
- **Description**: Get customer details with order history
- **Auth**: Required (Admin)
- **Response**: Customer details + recent orders

### Update Customer Status
- **PUT** `/api/v1/admin/customers/:id/status`
- **Description**: Update customer account status
- **Auth**: Required (Admin)
- **Body**: `{ status: 'Active' | 'Inactive' | 'Suspended' }`
- **Response**: Success message

### Delete Customer (Soft Delete)
- **DELETE** `/api/v1/admin/customers/:id`
- **Description**: Soft delete customer (sets status to 'Deleted')
- **Auth**: Required (Admin)
- **Response**: Success message

## Coupon Management

### Get All Coupons
- **GET** `/api/v1/admin/coupons`
- **Description**: Get all coupons with filtering
- **Auth**: Required (Admin)
- **Query Params**: `page`, `limit`, `status`, `search`
- **Response**: Paginated coupon list

### Get Single Coupon
- **GET** `/api/v1/admin/coupons/:id`
- **Description**: Get coupon details
- **Auth**: Required (Admin)
- **Response**: Coupon details

### Create Coupon
- **POST** `/api/v1/admin/coupons`
- **Description**: Create a new coupon
- **Auth**: Required (Admin)
- **Body**: Coupon data (code, type, value, validFrom, validUntil, etc.)
- **Response**: Created coupon with ID

### Update Coupon
- **PUT** `/api/v1/admin/coupons/:id`
- **Description**: Update existing coupon
- **Auth**: Required (Admin)
- **Body**: Updated coupon fields
- **Response**: Updated coupon

### Delete Coupon
- **DELETE** `/api/v1/admin/coupons/:id`
- **Description**: Delete coupon
- **Auth**: Required (Admin)
- **Response**: Success message

## Notification Management

### Get All Notifications
- **GET** `/api/v1/admin/notifications`
- **Description**: Get all notifications
- **Auth**: Required (Admin)
- **Response**: Array of notifications

### Get Single Notification
- **GET** `/api/v1/admin/notifications/:id`
- **Description**: Get notification details
- **Auth**: Required (Admin)
- **Response**: Notification details

### Create Notification
- **POST** `/api/v1/admin/notifications`
- **Description**: Create a new notification
- **Auth**: Required (Admin)
- **Body**: Notification data (title, message, type, target, recipients, scheduledAt)
- **Response**: Created notification with ID

### Update Notification
- **PUT** `/api/v1/admin/notifications/:id`
- **Description**: Update existing notification
- **Auth**: Required (Admin)
- **Body**: Updated notification fields
- **Response**: Updated notification

### Delete Notification
- **DELETE** `/api/v1/admin/notifications/:id`
- **Description**: Delete notification
- **Auth**: Required (Admin)
- **Response**: Success message

### Send Notification
- **POST** `/api/v1/admin/notifications/:id/send`
- **Description**: Send notification immediately
- **Auth**: Required (Admin)
- **Response**: Updated notification with sent status

### Schedule Notification
- **POST** `/api/v1/admin/notifications/:id/schedule`
- **Description**: Schedule notification for later
- **Auth**: Required (Admin)
- **Body**: `{ scheduledAt: ISO date string }`
- **Response**: Updated notification with scheduled status

### Get Notification Stats
- **GET** `/api/v1/admin/notifications/:id/stats`
- **Description**: Get notification delivery statistics
- **Auth**: Required (Admin)
- **Response**: Stats (sent, opened, clicked counts)

## Analytics

### Dashboard Analytics
- **GET** `/api/v1/admin/analytics/dashboard`
- **Description**: Get comprehensive dashboard statistics
- **Auth**: Required (Admin)
- **Query Params**: `timeRange` (7days, 30days, 90days, 1year, all)
- **Response**: Dashboard metrics

### Revenue Analytics
- **GET** `/api/v1/admin/analytics/revenue`
- **Description**: Get revenue analytics over time
- **Auth**: Required (Admin)
- **Query Params**: `timeRange`, `groupBy` (day, week, month)
- **Response**: Revenue data grouped by time period

### Order Analytics
- **GET** `/api/v1/admin/analytics/orders`
- **Description**: Get order analytics and status breakdown
- **Auth**: Required (Admin)
- **Query Params**: `timeRange`
- **Response**: Order counts by status

### Product Analytics
- **GET** `/api/v1/admin/analytics/products`
- **Description**: Get top-performing products
- **Auth**: Required (Admin)
- **Query Params**: `limit` (default: 10)
- **Response**: Top products by revenue

### Customer Analytics
- **GET** `/api/v1/admin/analytics/customers`
- **Description**: Get customer metrics
- **Auth**: Required (Admin)
- **Response**: Customer statistics (total, active, average orders/revenue)

## Admin Profile

### Get Admin Profile
- **GET** `/api/v1/admin/profile`
- **Description**: Get current admin profile
- **Auth**: Required (Admin)
- **Response**: Admin profile data

### Update Admin Profile
- **PUT** `/api/v1/admin/profile`
- **Description**: Update admin profile
- **Auth**: Required (Admin)
- **Body**: Updated profile fields
- **Response**: Updated profile

### Change Admin Password
- **PUT** `/api/v1/admin/profile/change-password`
- **Description**: Change admin password
- **Auth**: Required (Admin)
- **Body**: `{ currentPassword, newPassword }`
- **Response**: Success message

## File Upload

### Upload Product Image
- **POST** `/api/v1/upload/product-image`
- **Description**: Upload a single product image
- **Auth**: Required (Admin)
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (image file)
- **Response**: `{ url, filename }`

### Upload Multiple Product Images
- **POST** `/api/v1/upload/product-images`
- **Description**: Upload multiple product images
- **Auth**: Required (Admin)
- **Content-Type**: `multipart/form-data`
- **Body**: `files` (array of image files, max 5)
- **Response**: `{ files: [{ url, filename }, ...] }`

## Notes

### Authentication
All admin endpoints (except `/admin/auth/sign-in`) require:
1. Valid session cookie from BetterAuth
2. User role must be 'admin'

### Soft Deletes
The following resources use soft deletes (status update instead of permanent deletion):
- Products: Status set to 'Deleted'
- Customers: Status set to 'Deleted'

### Pagination
Most list endpoints support pagination with:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10-20 depending on endpoint)

### Error Responses
All endpoints return consistent error format:
```json
{
  "error": "Error message"
}
```

### Success Responses
All endpoints return consistent success format:
```json
{
  "success": true,
  "data": { ... }
}
```

For paginated responses:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
