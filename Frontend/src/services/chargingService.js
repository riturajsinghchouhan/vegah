import api from './api';

export const chargingService = {
  async listStations() {
    let combinedStations = [];

    // 1. Fetch real MongoDB charging stations
    try {
      const dbRes = await api.get('/charging-stations');
      const dbStations = (dbRes.data?.data?.stations || dbRes.data?.stations || []).map(s => ({
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
        image: s.imageUrl || '/assets/battery_swap.png',
        isElectica: false,
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
      const electicaStations = (elRes.data?.data || []).map(s => ({
        id: s.id,
        _id: s.id,
        name: s.name,
        address: s.location || 'Location details available on map',
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
        image: '/assets/battery_swap.png',
        lat: parseFloat(s.lat) || null,
        lng: parseFloat(s.lng) || null,
        speedLabel: 'Instant Battery Swap',
        amenities: ['Restroom', '24/7 Access'],
        supportedVehicles: ['Vegah EV', 'All Compatible Scooters'],
        paymentMethods: ['Vegah Wallet', 'UPI'],
      }));
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
          image: s.imageUrl || '/assets/battery_swap.png',
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

  async startSwap(stationId, entitlementRef) {
    const res = await api.post(`/electica/swaps/start`, { stationId, entitlementRef });
    return res.data;
  },

  async getSwapStatus(swapId) {
    const res = await api.get(`/electica/swaps/${swapId}`);
    return res.data;
  }
};
