import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:3000/api',
    VITE_AUTHME_URL: 'http://localhost:3000',
    VITE_AUTHME_REALM: 'test',
    VITE_AUTHME_CLIENT_ID: 'test-client',
    VITE_AUTHME_REDIRECT_URI: 'http://localhost:5174/callback',
  },
  writable: true,
});

afterEach(() => {
  cleanup();
});
