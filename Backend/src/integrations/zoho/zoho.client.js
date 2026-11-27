import axios from 'axios';
import env from '../../config/env.js';
import { createNonBlockingRedis } from '../../config/redis.js';
import logger from '../../utils/logger.js';
import { ApiError, BadRequestError } from '../../utils/errors.js';

/**
 * The transport layer for Zoho Books. Nothing here knows about bookings,
 * invoices or riders -- it only deals in access tokens, retries and Zoho's
 * envelope format.
 *
 * Zoho issues a self-client refresh token that never expires, and trades it for
 * an access token good for one hour. The refresh call itself is rate limited
 * (a few per minute per client), so the access token is cached in Redis and
 * shared across every worker rather than fetched per request.
 */

const ACCESS_TOKEN_KEY = 'zoho:books:access_token';
// Zoho says 3600s. Refreshing a minute early avoids a token expiring mid-flight.
const TOKEN_TTL_SECONDS = 3300;

let memoryToken = null;
// Zoho rejects concurrent refreshes from one client, so all callers that arrive
// while a refresh is running wait on the same promise instead of racing.
let refreshInFlight = null;

/**
 * A dedicated connection rather than the shared one, because this cache sits
 * in the request path: a booking completion awaits the Zoho push, so a Redis
 * command that waits forever would hang the rider's request instead of just
 * costing one token refresh.
 *
 * Created on first use so an install with Zoho switched off holds no
 * connection it never reads.
 */
let tokenCache;
const cache = () => {
  if (tokenCache === undefined) tokenCache = createNonBlockingRedis('Redis (Zoho tokens)');
  return tokenCache;
};

// Second line of defence: a connection that is up but wedged would still stall
// a request, and the in-memory token is a good enough answer to not wait.
const CACHE_TIMEOUT_MS = 2000;
const withTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`timed out after ${CACHE_TIMEOUT_MS}ms`)), CACHE_TIMEOUT_MS).unref();
  }),
]);

/**
 * One line per outage rather than one per token read. A down Redis costs a
 * refresh an hour, not correctness, so repeating it every call would bury the
 * errors that do need attention.
 */
let cacheWarned = false;
const warnCacheOnce = (what, error) => {
  if (cacheWarned) return;
  cacheWarned = true;
  logger.warn(`Zoho token cache ${what} failed (${error.message}); falling back to in-process token until Redis recovers`);
};

export const isConfigured = () => Boolean(
  env.ZOHO_ENABLED
  && env.ZOHO_CLIENT_ID
  && env.ZOHO_CLIENT_SECRET
  && env.ZOHO_REFRESH_TOKEN
  && env.ZOHO_ORGANIZATION_ID
);

const assertConfigured = () => {
  if (!isConfigured()) {
    throw new BadRequestError('Zoho Books is not configured. Set the ZOHO_* variables in .env');
  }
};

const readCachedToken = async () => {
  const client = cache();
  try {
    if (client) {
      const token = await withTimeout(client.get(ACCESS_TOKEN_KEY));
      if (token) {
        cacheWarned = false;
        return token;
      }
    }
  } catch (error) {
    warnCacheOnce('read', error);
  }
  if (memoryToken && Date.now() < memoryToken.expiresAt) return memoryToken.value;
  return null;
};

const writeCachedToken = async (token) => {
  // Set first, so a shared token is still held locally when Redis is down.
  memoryToken = { value: token, expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000 };
  const client = cache();
  try {
    if (client) {
      await withTimeout(client.set(ACCESS_TOKEN_KEY, token, 'EX', TOKEN_TTL_SECONDS));
    }
  } catch (error) {
    warnCacheOnce('write', error);
  }
};

const clearCachedToken = async () => {
  memoryToken = null;
  const client = cache();
  try {
    if (client) await withTimeout(client.del(ACCESS_TOKEN_KEY));
  } catch {
    // A stale cached token only costs one retry, so a failed delete is not fatal.
  }
};

const requestNewToken = async () => {
  const { data } = await axios.post(`${env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`, null, {
    params: {
      refresh_token: env.ZOHO_REFRESH_TOKEN,
      client_id: env.ZOHO_CLIENT_ID,
      client_secret: env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    },
    timeout: 20000,
  });

  // The OAuth endpoint answers 200 even when it refuses, with an `error` key.
  if (!data?.access_token) {
    throw new ApiError(502, `Zoho refused the refresh token: ${data?.error || 'no access_token returned'}`);
  }
  return data.access_token;
};

export const getAccessToken = async ({ forceRefresh = false } = {}) => {
  assertConfigured();

  if (!forceRefresh) {
    const cached = await readCachedToken();
    if (cached) return cached;
  }

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const token = await requestNewToken();
      await writeCachedToken(token);
      return token;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Zoho signals failure two ways: an HTTP error, or HTTP 200 with a non-zero
 * `code` in the body. Both are collapsed into one thrown ApiError here so
 * callers never have to inspect `response.data.code` themselves.
 */
const unwrap = (data) => {
  if (data && typeof data.code === 'number' && data.code !== 0) {
    throw new ApiError(422, `Zoho error ${data.code}: ${data.message || 'request rejected'}`);
  }
  return data;
};

const describeAxiosError = (error) => {
  const body = error.response?.data;
  if (body?.message) return `Zoho error ${body.code ?? error.response.status}: ${body.message}`;
  return error.message;
};

/**
 * One Zoho API call, with `organization_id` attached and the common failures
 * handled: an expired token is refreshed once, and throttling (429) or a
 * transient 5xx is retried with a widening gap.
 */
export const request = async ({ method, path, params = {}, data, retries = 2 }) => {
  assertConfigured();

  let token = await getAccessToken();
  let attempt = 0;
  let refreshed = false;

  for (;;) {
    try {
      const response = await axios({
        method,
        url: `${env.ZOHO_API_BASE_URL}${path}`,
        params: { organization_id: env.ZOHO_ORGANIZATION_ID, ...params },
        data,
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
        timeout: 30000,
      });
      return unwrap(response.data);
    } catch (error) {
      const status = error.response?.status;

      // A token can be revoked or expire early; retry once with a fresh one.
      if (status === 401 && !refreshed) {
        refreshed = true;
        await clearCachedToken();
        token = await getAccessToken({ forceRefresh: true });
        continue;
      }

      const retryable = status === 429 || (status >= 500 && status <= 599);
      if (retryable && attempt < retries) {
        attempt += 1;
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }

      if (error instanceof ApiError) throw error;
      throw new ApiError(status || 502, describeAxiosError(error));
    }
  }
};

export const get = (path, params) => request({ method: 'get', path, params });
export const post = (path, data, params) => request({ method: 'post', path, data, params });
export const put = (path, data, params) => request({ method: 'put', path, data, params });

/** Used by the admin health check to prove the credentials actually work. */
export const ping = async () => {
  const data = await get('/organizations');
  const org = (data.organizations || []).find((o) => o.organization_id === env.ZOHO_ORGANIZATION_ID);
  if (!org) {
    throw new BadRequestError(`Organization ${env.ZOHO_ORGANIZATION_ID} is not visible to these credentials`);
  }
  return {
    organizationId: org.organization_id,
    name: org.name,
    currency: org.currency_code,
    fiscalYearStart: org.fiscal_year_start_month,
    timeZone: org.time_zone,
  };
};
