import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../errorHandler';

describe('errorHandler', () => {
  it('returns correct message for 401 status', () => {
    const error = { response: { status: 401 } };
    expect(getErrorMessage(error)).toBe('Session expired. Please login again.');
  });

  it('returns correct message for 403 status', () => {
    const error = { response: { status: 403 } };
    expect(getErrorMessage(error)).toBe('You do not have permission to do this.');
  });

  it('returns correct message for 404 status', () => {
    const error = { response: { status: 404 } };
    expect(getErrorMessage(error)).toBe('The requested resource was not found.');
  });

  it('returns correct message for 409 status', () => {
    const error = { response: { status: 409 } };
    expect(getErrorMessage(error)).toBe('This record already exists.');
  });

  it('returns correct message for 500 status', () => {
    const error = { response: { status: 500 } };
    expect(getErrorMessage(error)).toBe('Server error. Please try again later.');
  });

  it('returns backend error message when present in response', () => {
    const error = { response: { data: { error: 'Custom backend error message' } } };
    expect(getErrorMessage(error)).toBe('Custom backend error message');
  });

  it('returns fallback message when error has no response', () => {
    const error = new Error('Network Error');
    expect(getErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });
});
