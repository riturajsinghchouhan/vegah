import api from "./api";

export const electicaService = {
  /**
   * Get all stations
   */
  async getStations() {
    const response = await api.get("/electica/stations");
    return response.data?.data || response.data;
  },

  /**
   * Get single station details
   */
  async getStation(id) {
    const endpoint = id ? `/electica/station/${id}` : "/electica/station";
    const response = await api.get(endpoint);
    return response.data?.data || response.data;
  },

  /**
   * Get pods for a station
   */
  async getPods(stationId) {
    const response = await api.get("/electica/pods", {
      params: stationId ? { stationId } : {},
    });
    return response.data?.data || response.data;
  },

  /**
   * Get all batteries
   */
  async getBatteries() {
    const response = await api.get("/electica/batteries");
    return response.data?.data || response.data;
  },

  /**
   * Get battery details by ID
   */
  async getBattery(id) {
    const response = await api.get(`/electica/batteries/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Get battery telemetry history
   */
  async getTelemetry(id, limit = 100) {
    const response = await api.get(`/electica/batteries/${id}/telemetry`, {
      params: { limit },
    });
    return response.data?.data || response.data;
  },

  /**
   * Get latest telemetry for a battery
   */
  async getLatestTelemetry(id) {
    const response = await api.get(`/electica/batteries/${id}/telemetry/latest`);
    return response.data?.data || response.data;
  },

  /**
   * Get swap activity log
   */
  async getSwaps(limit = 100) {
    const response = await api.get("/electica/swaps", {
      params: { limit },
    });
    return response.data?.data || response.data;
  },
};

export default electicaService;
