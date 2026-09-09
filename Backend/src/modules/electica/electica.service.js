import axios from 'axios';
import env from '../../config/env.js';
import redisClient from '../../config/redis.js';
import logger from '../../utils/logger.js';
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors.js';

// Simple in-memory fallback cache if Redis is unavailable
const memoryCache = new Map();
const DEFAULT_CACHE_TTL_MS = 5000; // 5 seconds cache to avoid exceeding 120 req/min

const getCache = async (key) => {
  try {
    if (redisClient && env.REDIS_ENABLED) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {
    logger.warn(`Redis getCache failed for key ${key}: ${err.message}`);
  }

  const cached = memoryCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  memoryCache.delete(key);
  return null;
};

const setCache = async (key, data, ttlSeconds = 5) => {
  try {
    if (redisClient && env.REDIS_ENABLED) {
      await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
      return;
    }
  } catch (err) {
    logger.warn(`Redis setCache failed for key ${key}: ${err.message}`);
  }

  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

// Safe number parser - avoids converting null/undefined to 0
const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return val;
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
};

// Data Normalizer for Electica entities
export const normalizeData = (data) => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(normalizeData);
  }

  if (typeof data === 'object') {
    const normalized = { ...data };
    const numericFields = [
      'soc',
      'health',
      'voltage',
      'currentDraw',
      'temperature',
      'cycleCount',
      'socPercentage',
      'packVoltage',
      'cellTemp',
      'totalPods',
      'availablePods',
      'lat',
      'lng',
      'latitude',
      'longitude',
    ];

    for (const key of Object.keys(normalized)) {
      if (numericFields.includes(key)) {
        normalized[key] = parseNumber(normalized[key]);
      } else if (typeof normalized[key] === 'object' && normalized[key] !== null) {
        normalized[key] = normalizeData(normalized[key]);
      }
    }
    return normalized;
  }

  return data;
};

// Base Axios instance creator with clean error handling
const getApiClient = () => {
  const baseURL = env.ELECTICA_BASE_URL || 'https://bss.electica.in/api/partner';
  const apiKey = env.ELECTICA_API_KEY;

  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });
};

const handleUpstreamError = (error, fallbackMessage = 'Electica API error') => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || fallbackMessage;

    switch (status) {
      case 401:
        throw new UnauthorizedError('Electica API authentication failed');
      case 403:
        throw new ForbiddenError('Electica station is not accessible');
      case 404:
        throw new NotFoundError('Electica resource not found');
      case 429:
        throw new ApiError(429, 'Electica rate limit exceeded. Please try again later.');
      case 500:
      default:
        throw new ApiError(status >= 500 ? status : 500, `Electica temporary error: ${message}`);
    }
  }

  if (error.code === 'ECONNABORTED') {
    throw new ApiError(504, 'Electica API connection timed out');
  }

  logger.error(`Electica network error: ${error.message}`);
  throw new ApiError(500, 'Unable to communicate with Electica service');
};

/**
 * Fetch All Stations
 */
export const getStations = async () => {
  const cacheKey = 'electica:stations';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const client = getApiClient();
    const response = await client.get('/stations');
    const data = normalizeData(response.data?.data || response.data);
    await setCache(cacheKey, data, 10);
    return data;
  } catch (error) {
    return handleUpstreamError(error, 'Failed to fetch stations');
  }
};

/**
 * Fetch Station By ID (defaults to config ELECTICA_STATION_ID)
 */
export const getStation = async (stationId) => {
  const id = stationId || env.ELECTICA_STATION_ID || 'BLR001';
  const cacheKey = `electica:station:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const client = getApiClient();
    const response = await client.get(`/stations/${id}`);
    const data = normalizeData(response.data?.data || response.data);
    await setCache(cacheKey, data, 5);
    return data;
  } catch (error) {
    return handleUpstreamError(error, `Failed to fetch station ${id}`);
  }
};

/**
 * Fetch Pods for Station
 */
export const getPods = async (stationId) => {
  const id = stationId || env.ELECTICA_STATION_ID || 'BLR001';
  const cacheKey = `electica:pods:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const client = getApiClient();
    const response = await client.get(`/stations/${id}/pods`);
    const data = normalizeData(response.data?.data || response.data);
    await setCache(cacheKey, data, 5);
    return data;
  } catch (error) {
    return handleUpstreamError(error, `Failed to fetch pods for station ${id}`);
  }
};

/**
 * Fetch All Batteries
 */
export const getBatteries = async () => {
  const cacheKey = 'electica:batteries';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const client = getApiClient();
    const response = await client.get('/batteries');
    const data = normalizeData(response.data?.data || response.data);
    await setCache(cacheKey, data, 5);
    return data;
  } catch (error) {
    return handleUpstreamError(error, 'Failed to fetch batteries');
  }
};

/**
 * Fetch Single Battery By ID
 */
export const getBattery = async (id) => {
  if (!id) {
    throw new ApiError(400, 'Battery ID is required');
  }

  const cacheKey = `electica:battery:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const client = getApiClient();
    const response = await client.get(`/batteries/${id}`);
    const data = normalizeData(response.data?.data || response.data);
    await setCache(cacheKey, data, 5);
    return data;
  } catch (error) {
    return handleUpstreamError(error, `Failed to fetch battery ${id}`);
  }
};

/**
 * Fetch Battery Telemetry History
 */
export const getBatteryTelemetry = async (id, limit = 100) => {
  if (!id) {
    throw new ApiError(400, 'Battery ID is required');
  }

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const cacheKey = `electica:telemetry:${id}:${parsedLimit}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const client = getApiClient();
    const response = await client.get(`/batteries/${id}/telemetry`, {
      params: { limit: parsedLimit },
    });
    const data = normalizeData(response.data?.data || response.data);
    await setCache(cacheKey, data, 5);
    return data;
  } catch (error) {
    return handleUpstreamError(error, `Failed to fetch telemetry for battery ${id}`);
  }
};

/**
 * Fetch Latest Battery Telemetry
 */
export const getLatestTelemetry = async (id) => {
  if (!id) {
    throw new ApiError(400, 'Battery ID is required');
  }

  const cacheKey = `electica:telemetry:latest:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const client = getApiClient();
    const response = await client.get(`/batteries/${id}/telemetry/latest`);
    const data = normalizeData(response.data?.data || response.data);
    await setCache(cacheKey, data, 5);
    return data;
  } catch (error) {
    return handleUpstreamError(error, `Failed to fetch latest telemetry for battery ${id}`);
  }
};

/**
 * Fetch Swaps
 */
export const getSwaps = async (limit = 100) => {
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const cacheKey = `electica:swaps:${parsedLimit}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  try {
    const client = getApiClient();
    const response = await client.get('/swaps', {
      params: { limit: parsedLimit },
    });
    const data = normalizeData(response.data?.data || response.data);
    await setCache(cacheKey, data, 5);
    return data;
  } catch (error) {
    return handleUpstreamError(error, 'Failed to fetch swaps');
  }
};
