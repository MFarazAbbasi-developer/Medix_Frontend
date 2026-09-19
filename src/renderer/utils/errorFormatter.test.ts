import { describe, it, expect } from 'vitest';
import { formatApiErrorMessage } from './errorFormatter';

describe('formatApiErrorMessage', () => {
  it('returns fallback message when error is null or undefined', () => {
    expect(formatApiErrorMessage(null)).toBe(
      'An error occurred while processing your request. Please try again.',
    );
    expect(formatApiErrorMessage(undefined, 'Custom fallback')).toBe('Custom fallback');
  });

  it('translates network connection errors cleanly', () => {
    const error = new Error('Network Error');
    expect(formatApiErrorMessage(error)).toContain('Cannot connect to the server');
  });

  it('translates session / token expiry errors', () => {
    const error = {
      response: {
        status: 401,
        data: { message: 'jwt expired' },
      },
    };
    expect(formatApiErrorMessage(error)).toContain('login session has expired');
  });

  it('translates credit limit errors', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Credit limit exceeded for customer' },
      },
    };
    expect(formatApiErrorMessage(error)).toContain('Customer credit limit is exceeded');
  });

  it('translates insufficient stock errors', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Insufficient batch quantity available in warehouse' },
      },
    };
    expect(formatApiErrorMessage(error)).toContain('Insufficient stock available');
  });

  it('never leaks raw Prisma or database internals', () => {
    const prismaError = {
      response: {
        status: 500,
        data: {
          message: 'Invalid `prisma.customer.create()` invocation: Unique constraint failed on the fields: (`code`)',
        },
      },
    };
    const formatted = formatApiErrorMessage(prismaError);
    expect(formatted).not.toContain('prisma');
    expect(formatted).not.toContain('invocation');
    expect(formatted).toBe('A record with this code, number, or title already exists. Please use a unique identifier.');
  });

  it('safely handles HTTP status fallbacks without response message', () => {
    expect(formatApiErrorMessage({ response: { status: 404 } })).toContain('could not be found');
    expect(formatApiErrorMessage({ response: { status: 403 } })).toContain('do not have permission');
    expect(formatApiErrorMessage({ response: { status: 500 } })).toContain('server encountered an issue');
  });

  it('handles array of error messages from class-validator', () => {
    const error = {
      response: {
        status: 400,
        data: { message: ['name should not be empty', 'sku must be a string'] },
      },
    };
    expect(formatApiErrorMessage(error)).toBe('name should not be empty | sku must be a string');
  });
});
