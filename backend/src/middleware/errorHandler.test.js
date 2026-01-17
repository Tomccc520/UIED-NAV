/**
 * @file errorHandler.test.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { errorHandler, notFoundHandler, asyncHandler } from './errorHandler.js';
import { ApiError, ErrorCode, ErrorStatusCode } from '../utils/ApiError.js';

/**
 * Property-Based Tests for Error Handler Middleware
 * 
 * Feature: api-optimization
 * Property 4: 错误响应格式一致性
 * Validates: Requirements 3.3
 * 
 * For any API错误响应，响应体应包含code、message、timestamp、path字段，
 * 且code应为预定义的错误代码之一。
 */

// Mock request object
const createMockReq = (path = '/test') => ({
  path,
  method: 'GET',
  headers: {},
});

// Mock response object
const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    headersSent: false,
    status: vi.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    }),
  };
  return res;
};

// Mock next function
const createMockNext = () => vi.fn();

describe('Error Handler Middleware - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 4: 错误响应格式一致性
   * For any API错误响应，响应体应包含code、message、timestamp、path字段
   * Validates: Requirements 3.3
   */
  describe('Property 4: Error Response Format Consistency', () => {
    // Arbitrary for generating valid error codes
    const errorCodeArb = fc.constantFrom(...Object.values(ErrorCode));
    
    // Arbitrary for generating error messages
    const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 });
    
    // Arbitrary for generating request paths
    const pathArb = fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s.replace(/[^a-zA-Z0-9/-]/g, '')}`);

    it('ApiError responses should always contain required fields (code, message, timestamp, path)', () => {
      fc.assert(
        fc.property(
          errorCodeArb,
          errorMessageArb,
          pathArb,
          (code, message, path) => {
            const req = createMockReq(path);
            const res = createMockRes();
            const next = createMockNext();
            
            const error = new ApiError(code, message);
            
            errorHandler(error, req, res, next);
            
            // Verify response structure
            expect(res.body).toBeDefined();
            expect(res.body).toHaveProperty('code');
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('path');
            
            // Verify code is one of the predefined error codes
            expect(Object.values(ErrorCode)).toContain(res.body.code);
            
            // Verify path matches request path
            expect(res.body.path).toBe(path);
            
            // Verify timestamp is a valid ISO string
            expect(() => new Date(res.body.timestamp)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('error code should map to correct HTTP status code', () => {
      fc.assert(
        fc.property(
          errorCodeArb,
          errorMessageArb,
          (code, message) => {
            const req = createMockReq();
            const res = createMockRes();
            const next = createMockNext();
            
            const error = new ApiError(code, message);
            
            errorHandler(error, req, res, next);
            
            // Verify status code matches the error code mapping
            const expectedStatusCode = ErrorStatusCode[code] || 500;
            expect(res.statusCode).toBe(expectedStatusCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generic errors should also produce consistent response format', () => {
      fc.assert(
        fc.property(
          errorMessageArb,
          pathArb,
          (message, path) => {
            const req = createMockReq(path);
            const res = createMockRes();
            const next = createMockNext();
            
            const error = new Error(message);
            
            errorHandler(error, req, res, next);
            
            // Verify response structure for generic errors
            expect(res.body).toBeDefined();
            expect(res.body).toHaveProperty('code');
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('path');
            
            // Generic errors should default to INTERNAL_ERROR
            expect(res.body.code).toBe(ErrorCode.INTERNAL_ERROR);
            expect(res.statusCode).toBe(500);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for ApiError class
   */
  describe('ApiError Class Properties', () => {
    it('ApiError.toJSON should produce valid JSON with required fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ErrorCode)),
          fc.string({ minLength: 1, maxLength: 200 }),
          (code, message) => {
            const error = new ApiError(code, message);
            const json = error.toJSON();
            
            expect(json).toHaveProperty('code', code);
            expect(json).toHaveProperty('message', message);
            expect(json).toHaveProperty('timestamp');
            expect(() => new Date(json.timestamp)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('ApiError factory methods should create errors with correct codes', () => {
      const factoryMethods = [
        { method: 'notFound', expectedCode: ErrorCode.NOT_FOUND, expectedStatus: 404 },
        { method: 'validationError', expectedCode: ErrorCode.VALIDATION_ERROR, expectedStatus: 400 },
        { method: 'unauthorized', expectedCode: ErrorCode.UNAUTHORIZED, expectedStatus: 401 },
        { method: 'forbidden', expectedCode: ErrorCode.FORBIDDEN, expectedStatus: 403 },
        { method: 'internalError', expectedCode: ErrorCode.INTERNAL_ERROR, expectedStatus: 500 },
        { method: 'rateLimited', expectedCode: ErrorCode.RATE_LIMITED, expectedStatus: 429 },
        { method: 'badRequest', expectedCode: ErrorCode.BAD_REQUEST, expectedStatus: 400 },
        { method: 'conflict', expectedCode: ErrorCode.CONFLICT, expectedStatus: 409 },
        { method: 'serviceUnavailable', expectedCode: ErrorCode.SERVICE_UNAVAILABLE, expectedStatus: 503 },
      ];

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.constantFrom(...factoryMethods),
          (message, { method, expectedCode, expectedStatus }) => {
            const error = ApiError[method](message);
            
            expect(error).toBeInstanceOf(ApiError);
            expect(error.code).toBe(expectedCode);
            expect(error.statusCode).toBe(expectedStatus);
            expect(error.message).toBe(message);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tests for notFoundHandler middleware
   */
  describe('notFoundHandler Middleware', () => {
    it('should create NOT_FOUND error with correct path', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-zA-Z0-9/-]/g, '')}`),
          (method, path) => {
            const req = { ...createMockReq(path), method };
            const res = createMockRes();
            const next = createMockNext();
            
            notFoundHandler(req, res, next);
            
            // Should call next with an ApiError
            expect(next).toHaveBeenCalledTimes(1);
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(ApiError);
            expect(error.code).toBe(ErrorCode.NOT_FOUND);
            expect(error.statusCode).toBe(404);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tests for asyncHandler wrapper
   */
  describe('asyncHandler Wrapper', () => {
    it('should pass errors to next for rejected promises', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (errorMessage) => {
            const req = createMockReq();
            const res = createMockRes();
            const next = createMockNext();
            
            const asyncFn = async () => {
              throw new Error(errorMessage);
            };
            
            const wrappedFn = asyncHandler(asyncFn);
            await wrappedFn(req, res, next);
            
            // Should call next with the error
            expect(next).toHaveBeenCalledTimes(1);
            expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
            expect(next.mock.calls[0][0].message).toBe(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not call next for successful async functions', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.jsonValue(),
          async (responseData) => {
            const req = createMockReq();
            const res = createMockRes();
            const next = createMockNext();
            
            const asyncFn = async (req, res) => {
              res.json(responseData);
            };
            
            const wrappedFn = asyncHandler(asyncFn);
            await wrappedFn(req, res, next);
            
            // Should not call next
            expect(next).not.toHaveBeenCalled();
            // Should have called res.json
            expect(res.json).toHaveBeenCalledWith(responseData);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
