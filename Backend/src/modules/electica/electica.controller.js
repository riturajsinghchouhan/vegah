import * as electicaService from './electica.service.js';
import { sendSuccess } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { distanceInMeters } from '../../utils/geo.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';
import Booking from '../../models/Booking.js';
import BatterySwapLog from '../../models/BatterySwapLog.js';
import ChargingStation from '../../models/ChargingStation.js';

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
  // Electica numbers pods from 1 and names the field `pod`; keep podNumber last
  // so a raw string value from upstream can't shadow the parsed number.
  if (Array.isArray(pods)) {
    return pods
      .map((pod, idx) => ({ ...pod, podNumber: Number(pod?.podNumber ?? pod?.pod ?? pod?.number ?? idx + 1) }))
      .sort((a, b) => a.podNumber - b.podNumber);
  }
  if (!pods || typeof pods !== 'object') return [];
  return Object.entries(pods)
    .map(([key, pod]) => ({ ...pod, podNumber: Number(pod?.podNumber ?? pod?.pod ?? pod?.number ?? key) }))
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

/**
 * A rider must physically be at the station to swap, so the coordinates the app
 * reports are checked against the station's own position. GPS is noisy, so the
 * reading's own accuracy radius is granted as slack - capped at the gate radius
 * so a deliberately vague fix can't widen the gate without limit.
 *
 * The position compared against is the one an admin pinned on the charging
 * station record, which is what riders are shown and navigated to. The partner
 * API reports a generic city-centre coordinate for every station, so measuring
 * against it put riders hundreds of kilometres "away" while they stood at the
 * pod. Without an admin pin there is no trustworthy target, so the gate opens
 * rather than blocking a rider over a coordinate nobody set.
 */
const assertRiderIsAtStation = async (stationId, { lat, lng, accuracy }) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(400, 'Your location is required to start a battery swap');
  }

  const adminStation = await ChargingStation.findOne({
    electicaStationId: String(stationId),
  })
    .select('coordinates')
    .lean();

  const [adminLng, adminLat] = adminStation?.coordinates?.coordinates || [];
  const stationLat = Number(adminLat);
  const stationLng = Number(adminLng);

  if (!Number.isFinite(stationLat) || !Number.isFinite(stationLng)) {
    logger.warn(
      `Station ${stationId} has no admin-set coordinates - proximity check skipped`
    );
    return;
  }

  const radius = env.SWAP_PROXIMITY_RADIUS_METERS;
  const distance = distanceInMeters(lat, lng, stationLat, stationLng);
  const slack = Math.min(Number(accuracy) || 0, radius);

  if (distance - slack > radius) {
    throw new ApiError(
      403,
      `You need to be within ${radius}m of the station to start a swap. You are about ${Math.round(distance)}m away.`
    );
  }
};

/**
 * Electica refuses a swap with a bare "No battery is currently sitting in a pod
 * at <station>", which reads to a rider as if the app is broken. The station's
 * own pod report says why - a pod may be charging and minutes away from ready -
 * so the refusal is re-told with that live state instead of the raw upstream
 * sentence. Reading the pods must never turn a refusal into a crash, so any
 * failure there falls back to the original error.
 */
const startSwapWithReadableStock = async (stationId, entitlementRef) => {
  try {
    return await electicaService.startSwap(stationId, entitlementRef);
  } catch (error) {
    if (error?.statusCode !== 409 || !/no battery/i.test(error.message || '')) {
      throw error;
    }

    let detail = '';
    try {
      const pods = podsToArray(await electicaService.getPods(stationId));
      const charging = pods
        .filter((pod) => String(pod.state).toLowerCase() === 'charging')
        .sort((a, b) => (Number(b.soc) || 0) - (Number(a.soc) || 0));

      if (charging.length) {
        const best = charging[0];
        const soc = Number(best.soc);
        detail = Number.isFinite(soc)
          ? ` Pod ${best.podNumber} is charging and is at ${Math.round(soc)}% - please wait a few minutes and try again.`
          : ` Pod ${best.podNumber} is still charging - please wait a few minutes and try again.`;
      } else {
        detail = ' Every pod at this station is empty right now.';
      }
    } catch (podError) {
      logger.warn(`Could not read pods for ${stationId} while explaining a swap refusal: ${podError.message}`);
    }

    throw new ApiError(409, `No charged battery is ready at this station right now.${detail}`);
  }
};

export const startSwap = async (req, res, next) => {
  try {
    const { stationId, bookingId, lat, lng, accuracy } = req.body;
    if (!bookingId) {
      throw new ApiError(400, 'bookingId is required to start a swap');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || String(booking.user) !== String(req.user.id)) {
      throw new ApiError(404, 'Active booking not found for this user');
    }
    // An expired rental must not keep drawing batteries. The deadline is checked
    // first, and directly, because the job that flips a booking to OVERDUE lags
    // behind the clock - checking the status first told a rider whose time had
    // run out that they had no rental at all.
    const deadline = booking.tripEndsAt || booking.endDate;
    if (deadline && new Date(deadline).getTime() <= Date.now()) {
      throw new ApiError(
        400,
        'Your rental time has run out. Extend your rental to swap a battery.'
      );
    }

    // OVERDUE is a rental the rider is still holding, so it is a deadline
    // problem, never a missing-rental one - the check above has already spoken
    // for it by the time it could reach here.
    if (!['ACTIVE', 'PENDING_RETURN', 'OVERDUE'].includes(booking.status)) {
      throw new ApiError(400, 'Battery swap is only available during an active rental');
    }

    await assertRiderIsAtStation(stationId, {
      lat: Number(lat),
      lng: Number(lng),
      accuracy,
    });

    // The entitlement reference ties this swap to a real booking/user, not a
    // placeholder - it's what let this flow fabricate per-user swap history before.
    const entitlementRef = `BOOKING-${booking.bookingId || booking._id}`;
    const swap = await startSwapWithReadableStock(stationId, entitlementRef);

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
