import { CallHandler } from '@nestjs/common';
import { SanitizeInterceptor } from './sanitize.interceptor.js';

describe('SanitizeInterceptor', () => {
  let interceptor: SanitizeInterceptor;

  beforeEach(() => {
    interceptor = new SanitizeInterceptor();
  });

  // Call sanitize() directly. It returns a new sanitized object (does not mutate in-place).
  const sanitize = (body: unknown) => (interceptor as any).sanitize(body);

  describe('sanitize', () => {
    it('strips script tags from string fields', () => {
      const result = sanitize({ name: '<script>alert(1)</script>Test' });
      expect(result.name).toBe('Test');
    });

    it('strips style tags from string fields', () => {
      const result = sanitize({ bio: '<style>body{}</style>Hello' });
      expect(result.bio).toBe('Hello');
    });

    it('strips encoded HTML entities', () => {
      const result = sanitize({ desc: '&lt;script&gt;alert(1)&lt;/script&gt;' });
      expect(result.desc).not.toContain('<script>');
    });

    it('sanitizes nested objects', () => {
      const result = sanitize({ user: { name: '<b>Bold</b>', email: 'test@example.com' } });
      expect(result.user.name).toBe('Bold');
      expect(result.user.email).toBe('test@example.com');
    });

    it('sanitizes arrays of strings', () => {
      const result = sanitize({ tags: ['<script>x</script>tag', 'normal'] });
      expect(result.tags[0]).toBe('tag');
      expect(result.tags[1]).toBe('normal');
    });

    it('sanitizes arrays of objects', () => {
      const result = sanitize({ items: [{ name: '<i>italic</i>' }, { name: 'plain' }] });
      expect(result.items[0].name).toBe('italic');
      expect(result.items[1].name).toBe('plain');
    });

    it('leaves null values unchanged', () => {
      const result: any = sanitize({ name: null, age: 30 });
      expect(result.name).toBeNull();
      expect(result.age).toBe(30);
    });

    it('leaves numeric values unchanged', () => {
      const result = sanitize({ price: 100.5, count: 42 });
      expect(result.price).toBe(100.5);
      expect(result.count).toBe(42);
    });

    it('handles mixed XSS payloads in object fields', () => {
      const result = sanitize({
        input: '<script>alert("xss")</script><img src=x onerror=alert(1)>Plain text',
      });
      expect(result.input).not.toContain('<script>');
      expect(result.input).not.toContain('<img');
      expect(result.input).toContain('Plain text');
    });

    it('passes through undefined', () => {
      expect(() => sanitize(undefined)).not.toThrow();
    });

    it('passes through null', () => {
      expect(() => sanitize(null)).not.toThrow();
    });
  });
});
