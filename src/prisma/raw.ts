import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Narrow helper that wraps PrismaPg adapter creation.
 * Only this file uses eslint-disable — the adapter instantiation
 * triggers no-unsafe-* rules due to PrismaPg's untyped surface.
 */
export function createPrismaPgAdapter(
  connectionString: string,
  poolSize: number,
  idleTimeoutMs: number,
) {
  return new PrismaPg({
    connectionString,
    max: poolSize,
    idleTimeoutMillis: idleTimeoutMs,
  });
}
