import { environment } from '../../../environments/environment'

/**
 * Stable, typed re-export of the active environment. Import `env` everywhere
 * instead of reaching into ../environments so the source can change in one place.
 */
export const env = environment
export type AppEnv = typeof environment
