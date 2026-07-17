export const DISTRIBUTED_LOCK_PORT = Symbol('DISTRIBUTED_LOCK_PORT');

export interface DistributedLockPort {
  runWithLock<T>(key: string, ttlMs: number, task: () => Promise<T>): Promise<T | null>;
}
