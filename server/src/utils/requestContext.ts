import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Carries the authenticated actor's display name through a request's async
 * call chain so deep service-layer code (which never sees `req`) can attribute
 * audit events to a real person instead of a hardcoded default. Set once per
 * request in the `requireAuth` middleware; reads outside any request (seed
 * scripts, unauthenticated routes) simply see no store and fall back.
 */
const actorStorage = new AsyncLocalStorage<string>();

export function runWithActor<T>(actor: string, fn: () => T): T {
  return actorStorage.run(actor, fn);
}

export function getCurrentActor(): string | undefined {
  return actorStorage.getStore();
}
