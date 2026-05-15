import { describe, it, expect } from 'vitest';
import { toCsv, escapeCsvField } from './csv';

describe('escapeCsvField', () => {
  it('returns plain string for simple values', () => {
    expect(escapeCsvField('hello')).toBe('hello');
  });

  it('wraps field with comma in quotes', () => {
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
  });

  it('wraps field with double quote in quotes and doubles inner quotes', () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
  });

  it('wraps field with newline in quotes', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('handles null and undefined', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('converts numbers and booleans to strings', () => {
    expect(escapeCsvField(42)).toBe('42');
    expect(escapeCsvField(true)).toBe('true');
  });
});

describe('toCsv', () => {
  it('returns empty string for empty rows', () => {
    expect(toCsv([])).toBe('');
  });

  it('uses object keys as headers by default', () => {
    expect(toCsv([{ name: 'Alice', age: 30 }])).toBe('name,age\nAlice,30');
  });

  it('respects custom header order', () => {
    const rows = [{ name: 'Alice', age: 30 }];
    expect(toCsv(rows, ['age', 'name'])).toBe('age,name\n30,Alice');
  });

  it('escapes fields containing commas', () => {
    const rows = [{ name: 'Doe, John' }];
    expect(toCsv(rows)).toBe('name\n"Doe, John"');
  });

  it('escapes fields containing double quotes', () => {
    const rows = [{ name: 'Bob "TheBuilder"' }];
    expect(toCsv(rows)).toBe('name\n"Bob ""TheBuilder"""');
  });

  it('escapes fields containing newlines', () => {
    const rows = [{ name: 'Line1\nLine2' }];
    expect(toCsv(rows)).toBe('name\n"Line1\nLine2"');
  });

  it('handles mixed adversarial inputs', () => {
    const rows = [{ name: 'Smith, "Bob"' }];
    expect(toCsv(rows)).toBe('name\n"Smith, ""Bob"""');
  });
});