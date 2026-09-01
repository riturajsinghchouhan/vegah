import { chargingStations } from "../data/chargingStations";
import { delay } from "../utils/delay";

export const chargingService = {
  async listStations() {
    await delay(400);
    return chargingStations;
  },
  async getStationById(stationId) {
    await delay(250);
    return chargingStations.find((station) => station.id === stationId) ?? null;
  },
};
