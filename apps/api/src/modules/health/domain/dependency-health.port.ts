export const DATABASE_HEALTH_PORT = Symbol('DATABASE_HEALTH_PORT');
export const CACHE_HEALTH_PORT = Symbol('CACHE_HEALTH_PORT');

export interface DependencyHealthPort {
  ping(): Promise<void>;
}
