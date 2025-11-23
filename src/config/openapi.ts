import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Steflon Essentials API',
    version: '1.0.0',
    description: 'API documentation for Steflon Essentials e-commerce platform',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User and admin authentication endpoints' },
    { name: 'Products', description: 'Product management endpoints' },
    { name: 'Cart', description: 'Shopping cart endpoints' },
    { name: 'Wishlist', description: 'Wishlist management endpoints' },
    { name: 'Orders', description: 'Order management endpoints' },
    { name: 'Addresses', description: 'Address management endpoints' },
    { name: 'Profile', description: 'User profile management endpoints' },
    { name: 'Admin Products', description: 'Admin product management endpoints' },
    { name: 'Admin Orders', description: 'Admin order management endpoints' },
    { name: 'Admin Customers', description: 'Admin customer management endpoints' },
    { name: 'Admin Analytics', description: 'Admin analytics endpoints' },
    { name: 'Admin Profile', description: 'Admin profile management endpoints' },
    { name: 'Upload', description: 'File upload endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from authentication endpoints',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
          },
          message: {
            type: 'string',
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          originalPrice: { type: 'number' },
          images: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          brand: { type: 'string' },
          sku: { type: 'string' },
          stock: { type: 'number' },
          status: { type: 'string', enum: ['Active', 'Inactive', 'OutOfStock'] },
          featured: { type: 'boolean' },
          bestseller: { type: 'boolean' },
          rating: { type: 'number' },
          reviewCount: { type: 'number' },
          tags: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                productId: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' },
                product: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          total: { type: 'number' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderNumber: { type: 'string' },
          userId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                name: { type: 'string' },
                price: { type: 'number' },
                quantity: { type: 'number' },
                total: { type: 'number' },
              },
            },
          },
          subtotal: { type: 'number' },
          shipping: { type: 'number' },
          tax: { type: 'number' },
          total: { type: 'number' },
          status: {
            type: 'string',
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
          },
          paymentStatus: {
            type: 'string',
            enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          type: { type: 'string', enum: ['shipping', 'billing', 'both'] },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          addressLine1: { type: 'string' },
          addressLine2: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' },
          country: { type: 'string' },
          isDefault: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          total: { type: 'number' },
          totalPages: { type: 'number' },
        },
      },
    },
  },
  paths: {
    // Authentication endpoints (handled by BetterAuth)
    '/auth/sign-up': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        description: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/sign-in': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user and create session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/sign-out': {
      post: {
        tags: ['Authentication'],
        summary: 'User logout',
        description: 'End user session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/auth/get-session': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current session',
        description: 'Get current user session information',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Session information',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/user/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: 'Get authenticated user profile information',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    // Product endpoints
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Get all products',
        description: 'Get paginated list of products with filtering and sorting',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price', 'name', 'createdAt', 'rating'], default: 'createdAt' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of products',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Product' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/products/featured': {
      get: {
        tags: ['Products'],
        summary: 'Get featured products',
        description: 'Get list of featured products',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          '200': {
            description: 'List of featured products',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Product' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/products/bestsellers': {
      get: {
        tags: ['Products'],
        summary: 'Get bestseller products',
        description: 'Get list of bestseller products',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          '200': {
            description: 'List of bestseller products',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Product' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get single product by ID',
        description: 'Get detailed information about a specific product',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Product details',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '404': {
            description: 'Product not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/products/categories': {
      get: {
        tags: ['Products'],
        summary: 'Get all categories',
        description: 'Get all product categories with product counts',
        responses: {
          '200': {
            description: 'List of categories',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    // Cart endpoints
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get user cart',
        description: 'Get current user shopping cart',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Cart information',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Cart' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/cart/add': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        description: 'Add a product to the shopping cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1, default: 1 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Item added to cart',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Cart' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/cart/update/{itemId}': {
      put: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        description: 'Update the quantity of an item in the cart',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Cart item updated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Cart' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/cart/remove/{itemId}': {
      delete: {
        tags: ['Cart'],
        summary: 'Remove item from cart',
        description: 'Remove an item from the shopping cart',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Item removed from cart',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/cart/clear': {
      delete: {
        tags: ['Cart'],
        summary: 'Clear entire cart',
        description: 'Remove all items from the shopping cart',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Cart cleared',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    // Wishlist endpoints
    '/wishlist': {
      get: {
        tags: ['Wishlist'],
        summary: 'Get user wishlist',
        description: 'Get current user wishlist',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Wishlist items',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/wishlist/add': {
      post: {
        tags: ['Wishlist'],
        summary: 'Add product to wishlist',
        description: 'Add a product to the user wishlist',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product added to wishlist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/wishlist/remove/{productId}': {
      delete: {
        tags: ['Wishlist'],
        summary: 'Remove product from wishlist',
        description: 'Remove a product from the user wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Product removed from wishlist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/wishlist/check/{productId}': {
      get: {
        tags: ['Wishlist'],
        summary: 'Check if product is in wishlist',
        description: 'Check if a product exists in the user wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Wishlist check result',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            inWishlist: { type: 'boolean' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    // Order endpoints
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Get user orders',
        description: 'Get paginated list of user orders',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Order' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create new order',
        description: 'Create a new order from cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['shippingAddressId'],
                properties: {
                  shippingAddressId: { type: 'string' },
                  billingAddressId: { type: 'string' },
                  paymentMethod: { type: 'string', default: 'Credit Card' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Order' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get single order',
        description: 'Get detailed information about a specific order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Order details',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Order' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Cancel an order',
        description: 'Cancel a pending or processing order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Order cancelled',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/orders/{id}/reorder': {
      post: {
        tags: ['Orders'],
        summary: 'Reorder items',
        description: 'Add items from a previous order to cart',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Items added to cart',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    // Address endpoints
    '/addresses': {
      get: {
        tags: ['Addresses'],
        summary: 'Get user addresses',
        description: 'Get all saved addresses for the user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of addresses',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Address' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Addresses'],
        summary: 'Add new address',
        description: 'Add a new address to user account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Address' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Address added',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Address' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/addresses/{id}': {
      put: {
        tags: ['Addresses'],
        summary: 'Update address',
        description: 'Update an existing address',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Address' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Address updated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Address' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Addresses'],
        summary: 'Delete address',
        description: 'Delete an address from user account',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Address deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/addresses/{id}/set-default': {
      put: {
        tags: ['Addresses'],
        summary: 'Set default address',
        description: 'Set an address as the default address',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Default address updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    // Profile endpoints
    '/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get user profile',
        description: 'Get current user profile information',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Profile'],
        summary: 'Update user profile',
        description: 'Update user profile information',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/profile/change-password': {
      put: {
        tags: ['Profile'],
        summary: 'Change password',
        description: 'Change user password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password changed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    // Admin endpoints
    '/admin/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current admin',
        description: 'Get current admin profile information',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Admin profile',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/admin/products': {
      get: {
        tags: ['Admin Products'],
        summary: 'Get all products (admin)',
        description: 'Get all products with advanced filtering for admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of products',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Product' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Admin Products'],
        summary: 'Create new product',
        description: 'Create a new product (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Product' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/admin/products/{id}': {
      get: {
        tags: ['Admin Products'],
        summary: 'Get single product (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Product details',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Admin Products'],
        summary: 'Update product',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Product' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product updated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Admin Products'],
        summary: 'Delete product',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Product deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/admin/orders': {
      get: {
        tags: ['Admin Orders'],
        summary: 'Get all orders (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Success' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Order' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/admin/analytics/dashboard': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Get dashboard statistics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'timeRange', in: 'query', schema: { type: 'string', enum: ['7days', '30days', '90days', '1year', 'all'], default: '30days' } },
        ],
        responses: {
          '200': {
            description: 'Dashboard statistics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
    '/upload/product-image': {
      post: {
        tags: ['Upload'],
        summary: 'Upload product image',
        description: 'Upload a single product image (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Image uploaded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
        },
      },
    },
  },
};

