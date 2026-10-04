import * as electicaService from './electica.service.js';
import { sendSuccess } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import Booking from '../../models/Booking.js';
import BatterySwapLog from '../../models/BatterySwapLog.js';

export const getStations = async (req, res, next) => {
  try {
    const stations = await electicaService.getStations();
    sendSuccess(res, 200, 'Stations fetched successfully', stations);
  } catch (error) {
    next(error);
  }
};

export const getStation = async (req, res, next) => {
  try {
    const stationId = req.params.id || req.query.id;
    const station = await electicaService.getStation(stationId);
    sendSuccess(res, 200, 'Station fetched successfully', station);
  } catch (error) {
    next(error);
  }
};

/**
 * The upstream BSS returns pods as an object keyed by pod number ("1".."6"),
 * but every consumer of this endpoint renders a list. Returning the raw object
 * meant `Array.isArray(...)` failed client-side and the pod grid silently showed
 * zero pods while six were docked, so the keyed form is flattened here into a
 * podNumber-carrying array.
 */
const podsToArray = (pods) => {
  if (Array.isArray(pods)) {
    return pods.map((pod, idx) => ({ podNumber: Number(pod?.podNumber ?? pod?.number ?? idx + 1), ...pod }));
  }
  if (!pods || typeof pods !== 'object') return [];
  return Object.entries(pods)
    .map(([key, pod]) => ({ podNumber: Number(pod?.podNumber ?? pod?.number ?? key), ...pod }))
    .sort((a, b) => a.podNumber - b.podNumber);
};

export const getPods = async (req, res, next) => {
  try {
    const stationId = req.params.id || req.query.stationId;
    const pods = await electicaService.getPods(stationId);
    sendSuccess(res, 200, 'Pods fetched successfully', podsToArray(pods));
  } catch (error) {
    next(error);
  }
};

export const getBatteries = async (req, res, next) => {
  try {
    const batteries = await electicaService.getBatteries();
    sendSuccess(res, 200, 'Batteries fetched successfully', batteries);
  } catch (error) {
    next(error);
  }
};

export const getBattery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const battery = await electicaService.getBattery(id);
    sendSuccess(res, 200, 'Battery fetched successfully', battery);
  } catch (error) {
    next(error);
  }
};

export const getBatteryTelemetry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit || 100;
    const telemetry = await electicaService.getBatteryTelemetry(id, limit);
    sendSuccess(res, 200, 'Battery telemetry fetched successfully', telemetry);
  } catch (error) {
    next(error);
  }
};

export const getLatestTelemetry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const latestTelemetry = await electicaService.getLatestTelemetry(id);
    sendSuccess(res, 200, 'Latest battery telemetry fetched successfully', latestTelemetry);
  } catch (error) {
    next(error);
  }
};

export const getSwaps = async (req, res, next) => {
  try {
    const limit = req.query.limit || 100;
    const swaps = await electicaService.getSwaps(limit);
    sendSuccess(res, 200, 'Swaps fetched successfully', swaps);
  } catch (error) {
    next(error);
  }
};

export const startSwap = async (req, res, next) => {
  try {
    const { stationId, bookingId } = req.body;
    if (!bookingId) {
      throw new ApiError(400, 'bookingId is required to start a swap');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || String(booking.user) !== String(req.user.id)) {
      throw new ApiError(404, 'Active booking not found for this user');
    }
    if (!['ACTIVE', 'OVERDUE', 'PENDING_RETURN'].includes(booking.status)) {
      throw new ApiError(400, 'Battery swap is only available during an active rental');
    }

    // The entitlement reference ties this swap to a real booking/user, not a
    // placeholder - it's what let this flow fabricate per-user swap history before.
    const entitlementRef = `BOOKING-${booking.bookingId || booking._id}`;
    const swap = await electicaService.startSwap(stationId, entitlementRef);

    await BatterySwapLog.create({
      user: req.user.id,
      booking: booking._id,
      stationId,
      electicaSwapId: swap?.id || swap?.swap_id || swap?.swapId || null,
      status: swap?.status || 'initiated',
    });

    sendSuccess(res, 201, 'Swap started successfully', swap);
  } catch (error) {
    next(error);
  }
};

export const getSwapStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const swap = await electicaService.getSwapStatus(id);
    sendSuccess(res, 200, 'Swap status fetched successfully', swap);
  } catch (error) {
    next(error);
  }
};

export const cancelSwap = async (req, res, next) => {
  try {
    const { id } = req.params;
    const swap = await electicaService.cancelSwap(id);
    sendSuccess(res, 200, 'Swap cancelled successfully', swap);
  } catch (error) {
    next(error);
  }
};

export const getInventoryMonitoring = async (req, res, next) => {
  try {
    const stationId = req.params.id || req.query.stationId;
    const data = await electicaService.getInventoryMonitoringData(stationId);
    sendSuccess(res, 200, 'Inventory monitoring data fetched successfully', data);
  } catch (error) {
    next(error);
  }
};
