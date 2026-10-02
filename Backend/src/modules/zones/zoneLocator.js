import Zone from '../../models/Zone.js';

// Max distance (km) from a zone for a user to be considered "in" it when the
// point is not inside the zone's drawn boundary.
export const NEARBY_ZONE_RADIUS_KM = 50;

const toRad = (deg) => (deg * Math.PI) / 180;

const distanceKm = (lat1, lng1, lat2, lng2) => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Boundary is stored as [{ latitude, longitude }, ...]
const getBoundaryPoints = (zone) =>
  Array.isArray(zone.boundary)
    ? zone.boundary.filter((p) => Number.isFinite(p?.latitude) && Number.isFinite(p?.longitude))
    : [];

// Ray-casting point-in-polygon test
const isInsideBoundary = (lat, lng, points) => {
  if (points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const { latitude: yi, longitude: xi } = points[i];
    const { latitude: yj, longitude: xj } = points[j];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

// Reference point for distance: pickup location, else boundary centroid
const getZoneCenter = (zone, points) => {
  const { latitude, longitude } = zone.pickupLocation || {};
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
  if (points.length === 0) return null;
  return {
    latitude: points.reduce((s, p) => s + p.latitude, 0) / points.length,
    longitude: points.reduce((s, p) => s + p.longitude, 0) / points.length,
  };
};

/**
 * Find the active zone the given coordinates belong to.
 * 1. A zone whose boundary contains the point.
 * 2. Otherwise the nearest zone within NEARBY_ZONE_RADIUS_KM.
 * Returns null when the user is outside every service area.
 */
export const findZoneForLocation = async (lat, lng) => {
  const zones = await Zone.find({ status: 'ACTIVE', deletedAt: null })
    .select('name subtitle boundary pickupLocation dropLocation')
    .lean();

  let nearest = null;
  for (const zone of zones) {
    const points = getBoundaryPoints(zone);
    if (isInsideBoundary(lat, lng, points)) return zone;

    const center = getZoneCenter(zone, points);
    if (!center) continue;
    const dist = distanceKm(lat, lng, center.latitude, center.longitude);
    if (dist <= NEARBY_ZONE_RADIUS_KM && (!nearest || dist < nearest.dist)) {
      nearest = { zone, dist };
    }
  }

  return nearest?.zone || null;
};
