import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Users API',
      version: '1.0.0',
      description: 'API для управления пользователями',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Локальный сервер',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'age'],
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор пользователя',
              example: 'abc123',
            },
            firstName: {
              type: 'string',
              description: 'Имя пользователя',
              example: 'Иван',
            },
            lastName: {
              type: 'string',
              description: 'Фамилия пользователя',
              example: 'Иванов',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
              example: 'ivan@example.com',
            },
            age: {
              type: 'integer',
              description: 'Возраст пользователя',
              minimum: 0,
              maximum: 150,
              example: 25,
            },
            isActive: {
              type: 'boolean',
              description: 'Статус активности',
              example: true,
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              description: 'Роль пользователя',
              example: 'user',
            },
            phone: {
              type: 'string',
              description: 'Номер телефона',
              example: '+7-999-123-45-67',
            },
            address: {
              type: 'object',
              properties: {
                city: {
                  type: 'string',
                  example: 'Москва',
                },
                country: {
                  type: 'string',
                  example: 'Россия',
                },
                zipCode: {
                  type: 'string',
                  example: '190000',
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'User not found',
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;