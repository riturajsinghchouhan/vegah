import api from './api';

export const chargingService = {
  async listStations() {
    let combinedStations = [];
    // Admin records that only exist to pin an Electica station to the real
    // address the admin picked, keyed by the partner station id.
    const electicaOverrides = new Map();

    // 1. Fetch real MongoDB charging stations
    try {
      const dbRes = await api.get('/charging-stations');
      const rawDbStations = dbRes.data?.data?.stations || dbRes.data?.stations || [];

      rawDbStations.forEach((s) => {
        if (s.electicaStationId) electicaOverrides.set(String(s.electicaStationId), s);
      });

      const dbStations = rawDbStations.filter(s => !s.electicaStationId).map(s => ({
        id: s._id || s.id,
        _id: s._id || s.id,
        name: s.name,
        address: s.address,
        status: s.status === 'AVAILABLE' ? 'Available' : s.status === 'BUSY' ? 'Busy' : 'Unavailable',
        openStatus: s.openStatus || s.operatingHours || 'Open 24/7',
        chargingType: s.chargingType || 'DC Fast',
        speedLabel: s.speedLabel || 'Fast Charge',
        connector: s.connector || 'CCS2',
        connectorTypes: s.connectorTypes || [s.connector].filter(Boolean),
        pricePerKwh: Number(s.pricePerKwh) || 18.0,
        availablePorts: s.availablePorts ?? 0,
        totalPorts: s.totalPorts ?? 0,
        availableChargers: s.availablePorts ?? 0,
        totalChargers: s.totalPorts ?? 0,
        rating: s.rating ?? 0,
        amenities: s.amenities || [],
        supportedVehicles: s.supportedVehicles || [],
        paymentMethods: s.paymentMethods || [],
        image: s.imageUrl || '/assets/Charingstaionicon/image.png',
        isElectica: false,
        zone: s.zone?._id || s.zone || null,
        zoneName: s.zone?.name || null,
        lat: s.coordinates?.coordinates ? s.coordinates.coordinates[1] : null,
        lng: s.coordinates?.coordinates ? s.coordinates.coordinates[0] : null,
      }));
      combinedStations.push(...dbStations);
    } catch (err) {
      console.error('Failed to fetch DB charging stations', err);
    }

    // 2. Fetch Electica partner stations
    try {
      const elRes = await api.get(`/electica/stations`);
      const electicaStations = (elRes.data?.data || []).map(s => {
        const override = electicaOverrides.get(String(s.id));
        const overrideLat = override?.coordinates?.coordinates?.[1];
        const overrideLng = override?.coordinates?.coordinates?.[0];

        return {
          id: s.id,
          _id: s.id,
          name: s.name,
          address: override?.address || s.location || 'Location details available on map',
          status: s.status === 'online' ? 'Available' : 'Unavailable',
          openStatus: 'Open 24/7',
          chargingType: 'Battery Swap',
          connector: 'Battery',
          pricePerKwh: Number(s.pricePerKwh || s.price) || 18.0,
          availablePorts: s.pods ?? 0,
          totalPorts: s.pods ?? 0,
          availableChargers: s.pods ?? 0,
          totalChargers: s.pods ?? 0,
          isElectica: true,
          image: '/assets/Charingstaionicon/image.png',
          lat: Number.isFinite(overrideLat) ? overrideLat : (parseFloat(s.lat) || null),
          lng: Number.isFinite(overrideLng) ? overrideLng : (parseFloat(s.lng) || null),
          zone: override?.zone?._id || override?.zone || null,
          zoneName: override?.zone?.name || null,
          speedLabel: 'Instant Battery Swap',
          amenities: ['Restroom', '24/7 Access'],
          supportedVehicles: ['Swoop EV', 'All Compatible Scooters'],
          paymentMethods: ['Swoop Wallet', 'UPI'],
          };
      });
      combinedStations.push(...electicaStations);
    } catch (e) {
      console.error('Failed to fetch electica stations', e);
    }

    return combinedStations;
  },

  async getStationById(stationId) {
    if (!stationId) return null;

    // First check in full list
    const all = await this.listStations();
    const found = all.find((s) => String(s.id) === String(stationId) || String(s._id) === String(stationId));
    if (found) return found;

    // Try DB direct endpoint
    try {
      const dbRes = await api.get(`/charging-stations/${stationId}`);
      const s = dbRes.data?.data || dbRes.data;
      if (s) {
        return {
          id: s._id || s.id,
          _id: s._id || s.id,
          name: s.name,
          address: s.address,
          status: s.status === 'AVAILABLE' ? 'Available' : s.status === 'BUSY' ? 'Busy' : 'Unavailable',
          openStatus: s.openStatus || s.operatingHours || 'Open 24/7',
          chargingType: s.chargingType || 'DC Fast',
          speedLabel: s.speedLabel || 'Fast Charge',
          connector: s.connector || 'CCS2',
          connectorTypes: s.connectorTypes || [s.connector].filter(Boolean),
          pricePerKwh: Number(s.pricePerKwh) || 18.0,
          availablePorts: s.availablePorts ?? 0,
          totalPorts: s.totalPorts ?? 0,
          availableChargers: s.availablePorts ?? 0,
          totalChargers: s.totalPorts ?? 0,
          rating: s.rating ?? 0,
          amenities: s.amenities || [],
          supportedVehicles: s.supportedVehicles || [],
          paymentMethods: s.paymentMethods || [],
          image: s.imageUrl || '/assets/Charingstaionicon/image.png',
          isElectica: false,
        };
      }
    } catch (e) {
      console.error('Failed to fetch station by id from DB', e);
    }

    return null;
  },

  async getPods(stationId) {
    try {
      const res = await api.get(`/electica/pods?stationId=${stationId}`);
      return res.data?.data || res.data || {};
    } catch (e) {
      console.error('Failed to fetch pods', e);
      return {};
    }
  },

  // bookingId ties this swap to the rider's real active rental, so the admin
  // panel can count real per-user swap history instead of a placeholder.
  async startSwap(stationId, bookingId, position) {
    const res = await api.post(`/electica/swaps/start`, {
      stationId,
      bookingId,
      lat: position?.lat,
      lng: position?.lng,
      accuracy: position?.accuracy,
    });
    return res.data;
  },

  async getSwapStatus(swapId) {
    const res = await api.get(`/electica/swaps/${swapId}`);
    return res.data;
  }
};
