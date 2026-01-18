/*
 * Copyright (c) 2026 Echo Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * OpenAPI 配置
 */
export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Echo API',
    version: '1.0.0',
    description: `
# Echo Feedback Management API

Welcome to the Echo API documentation. This API allows you to manage feedback, users, organizations, and more.

## Authentication

Most endpoints require an API key. Include it in the request header:

\`\`\`
X-API-Key: your_api_key_here
\`\`\`

## Rate Limiting

API requests are rate limited:
- **Free tier**: 100 requests/hour
- **Pro tier**: 1000 requests/hour

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: The maximum number of requests
- \`X-RateLimit-Remaining\`: Remaining requests
- \`X-RateLimit-Reset\`: Unix timestamp when the limit resets

## Error Responses

All errors follow this format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`

Common error codes:
- \`VALIDATION_ERROR\`: Invalid request data
- \`UNAUTHORIZED\`: Missing or invalid API key
- \`FORBIDDEN\`: Insufficient permissions
- \`NOT_FOUND\`: Resource not found
- \`RATE_LIMIT_EXCEEDED\`: Too many requests
    `,
    contact: {
      name: 'Echo API Support',
      email: 'api@echo.dev',
      url: 'https://echo.dev/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://api.echo.dev/v1',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key authentication',
      },
    },
    schemas: {
      Feedback: {
        type: 'object',
        required: ['feedbackId', 'title', 'status', 'type', 'priority', 'organizationId', 'createdAt'],
        properties: {
          feedbackId: {
            type: 'integer',
            description: 'Unique feedback identifier',
          },
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Feedback title',
            example: 'Add dark mode support',
          },
          description: {
            type: 'string',
            maxLength: 5000,
            description: 'Detailed feedback description',
            nullable: true,
          },
          type: {
            type: 'string',
            enum: ['bug', 'feature', 'issue', 'other'],
            description: 'Feedback type',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Feedback priority',
          },
          status: {
            type: 'string',
            enum: ['new', 'in-progress', 'planned', 'completed', 'closed'],
            description: 'Feedback status',
          },
          organizationId: {
            type: 'integer',
            description: 'Organization ID',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
          linearIssueId: {
            type: 'string',
            description: 'Associated Linear issue ID',
            nullable: true,
          },
          linearIssueUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL to Linear issue',
            nullable: true,
          },
        },
      },
      CreateFeedbackRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            example: 'Add dark mode support',
          },
          description: {
            type: 'string',
            maxLength: 5000,
            example: 'It would be great to have a dark mode option for better night-time usage.',
          },
          type: {
            type: 'string',
            enum: ['bug', 'feature', 'issue', 'other'],
            example: 'feature',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            example: 'medium',
          },
        },
      },
      UpdateFeedbackRequest: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
          },
          description: {
            type: 'string',
            maxLength: 5000,
          },
          type: {
            type: 'string',
            enum: ['bug', 'feature', 'issue', 'other'],
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
          status: {
            type: 'string',
            enum: ['new', 'in-progress', 'planned', 'completed', 'closed'],
          },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            description: 'Array of items',
          },
          meta: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                description: 'Current page number',
              },
              limit: {
                type: 'integer',
                description: 'Items per page',
              },
              total: {
                type: 'integer',
                description: 'Total number of items',
              },
              totalPages: {
                type: 'integer',
                description: 'Total number of pages',
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        required: ['error', 'code'],
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          code: {
            type: 'string',
            description: 'Error code',
            enum: [
              'VALIDATION_ERROR',
              'UNAUTHORIZED',
              'FORBIDDEN',
              'NOT_FOUND',
              'RATE_LIMIT_EXCEEDED',
              'INTERNAL_ERROR',
            ],
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Feedback',
      description: 'Feedback management endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Organizations',
      description: 'Organization management endpoints',
    },
    {
      name: 'Webhooks',
      description: 'Webhook configuration and management',
    },
    {
      name: 'API Keys',
      description: 'API key management',
    },
  ],
  paths: {},
};
