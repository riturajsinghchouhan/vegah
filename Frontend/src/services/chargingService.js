import { chargingStations } from "../data/chargingStations";
import { delay } from "../utils/delay";

import api from './api';

export const chargingService = {
  async listStations() {
    await delay(400);
    try {
      const res = await api.get(`/electica/stations`);
      const electicaStations = (res.data?.data || []).map(s => ({
        id: s.id,
        name: s.name,
        address: s.location,
        distance: 2.5, // Mock distance
        status: s.status === 'online' ? 'Available' : 'Unavailable',
        image: '/assets/battery_swap.png', // Fallback or mock image
        chargingType: 'Battery Swap',
        connector: 'Battery',
        pricePerKwh: 0,
        availablePorts: s.pods,
        totalPorts: s.pods,
        isElectica: true,
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lng),
        rating: 4.5,
        driveMinutes: 10,
        speedLabel: 'Instant Swap',
        availableChargers: s.pods,
        totalChargers: s.pods,
        amenities: ["Restroom", "Cafe"],
      }));
      return electicaStations;
    } catch (e) {
      console.error('Failed to fetch electica stations', e);
      return [];
    }
  },
  async getStationById(stationId) {
    await delay(250);
    const all = await this.listStations();
    return all.find((station) => station.id === stationId) ?? null;
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
