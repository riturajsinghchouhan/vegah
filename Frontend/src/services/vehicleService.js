import { vehicles } from "../data/vehicles";
import { delay } from "../utils/delay";

export const vehicleService = {
  async listVehicles() {
    await delay(350);
    return vehicles;
  },
  async getVehicleById(vehicleId) {
    await delay(250);
    return vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  },
};
