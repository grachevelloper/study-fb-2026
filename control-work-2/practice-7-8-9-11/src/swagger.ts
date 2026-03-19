import swaggerJsdoc from 'swagger-jsdoc';
import { PORT } from './configs';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Products API',
      version: '1.0.0',
      description: 'API для аутентификации и управления товарами',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Локальный сервер'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введите JWT токен в формате: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'abc123def456'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'ivan@example.com'
            },
            first_name: {
              type: 'string',
              example: 'Иван'
            },
            last_name: {
              type: 'string',
              example: 'Петров'
            }
          }
        },
        UserInput: {
          type: 'object',
          required: ['email', 'first_name', 'last_name', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'ivan@example.com'
            },
            first_name: {
              type: 'string',
              example: 'Иван'
            },
            last_name: {
              type: 'string',
              example: 'Петров'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'qwerty123'
            }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'ivan@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'qwerty123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful'
            },
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'prod123def456'
            },
            title: {
              type: 'string',
              example: 'Ноутбук'
            },
            category: {
              type: 'string',
              example: 'Электроника'
            },
            description: {
              type: 'string',
              example: 'Мощный ноутбук для работы и игр'
            },
            price: {
              type: 'number',
              example: 75000
            }
          }
        },
        ProductInput: {
          type: 'object',
          required: ['title', 'category', 'description', 'price'],
          properties: {
            title: {
              type: 'string',
              example: 'Ноутбук'
            },
            category: {
              type: 'string',
              example: 'Электроника'
            },
            description: {
              type: 'string',
              example: 'Мощный ноутбук для работы и игр'
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 75000
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);