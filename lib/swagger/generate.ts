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

import { writeFile } from 'fs/promises';
import { swaggerConfig } from './config';
import { join } from 'path';

/**
 * 生成 OpenAPI JSON 文件
 */
export async function generateOpenApiSpec() {
  const spec = {
    ...swaggerConfig,
    paths: {
      '/feedback': {
        get: {
          tags: ['Feedback'],
          summary: 'List feedback',
          description: 'Retrieve a paginated list of feedback items with optional filtering and sorting.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
              description: 'Items per page (max 100)',
            },
            {
              name: 'sort',
              in: 'query',
              schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'voteCount'] },
              description: 'Sort field',
            },
            {
              name: 'order',
              in: 'query',
              schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
              description: 'Sort order',
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['new', 'in-progress', 'planned', 'completed', 'closed'] },
              description: 'Filter by status',
            },
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string', enum: ['bug', 'feature', 'issue', 'other'] },
              description: 'Filter by type',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search in title and description',
            },
          ],
          responses: {
            200: {
              description: 'Successfully retrieved feedback list',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Feedback' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized - Invalid or missing API key',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            429: {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Feedback'],
          summary: 'Create feedback',
          description: 'Create a new feedback item.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateFeedbackRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Feedback created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Feedback' },
                      meta: {
                        type: 'object',
                        properties: {
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            401: {
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
      '/feedback/{id}': {
        get: {
          tags: ['Feedback'],
          summary: 'Get feedback by ID',
          description: 'Retrieve a single feedback item by its ID.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Feedback ID',
            },
          ],
          responses: {
            200: {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Feedback' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Feedback not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Feedback'],
          summary: 'Update feedback',
          description: 'Update an existing feedback item.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Feedback ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateFeedbackRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Feedback updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Feedback' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            404: {
              description: 'Feedback not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Feedback'],
          summary: 'Delete feedback',
          description: 'Soft delete a feedback item.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Feedback ID',
            },
          ],
          responses: {
            200: {
              description: 'Feedback deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Feedback not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
    },
  };

  await writeFile(
    join(process.cwd(), 'public', 'openapi.json'),
    JSON.stringify(spec, null, 2)
  );

  return spec;
}

export function getOpenApiSpec() {
  return {
    ...swaggerConfig,
    paths: {
      '/feedback': {
        get: {
          tags: ['Feedback'],
          summary: 'List feedback',
          description: 'Retrieve a paginated list of feedback items with optional filtering and sorting.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 }, description: 'Items per page (max 100)' },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'voteCount'] }, description: 'Sort field' },
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort order' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'in-progress', 'planned', 'completed', 'closed'] }, description: 'Filter by status' },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['bug', 'feature', 'issue', 'other'] }, description: 'Filter by type' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in title and description' },
          ],
          responses: {
            200: {
              description: 'Successfully retrieved feedback list',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PaginatedResponse' },
                      { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Feedback' } } } },
                    ],
                  },
                },
              },
            },
            401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Feedback'],
          summary: 'Create feedback',
          description: 'Create a new feedback item.',
          security: [{ ApiKeyAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateFeedbackRequest' } } } },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Feedback' } } } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/feedback/{id}': {
        get: {
          tags: ['Feedback'],
          summary: 'Get feedback by ID',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Feedback ID' }],
          responses: {
            200: { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Feedback' } } } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        put: {
          tags: ['Feedback'],
          summary: 'Update feedback',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Feedback ID' }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateFeedbackRequest' } } } },
          responses: {
            200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Feedback' } } } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Feedback'],
          summary: 'Delete feedback',
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Feedback ID' }],
          responses: {
            200: { description: 'Deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
    },
  };
}
