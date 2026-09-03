import api from "./api";

// Map backend vehicle structure to the frontend expected structure
const mapVehicle = (v) => ({
  id: v._id,
  name: v.name,
  type: v.type, // or v.category?.name
  brand: v.brand,
  model: v.model,
  rating: v.rating || 4.5,
  reviewsCount: v.reviewsCount || 0,
  rangeKm: v.rangeKm,
  battery: v.batteryCapacity,
  chargeTime: v.chargeTime,
  charging: v.chargingInfo,
  seats: v.seats,
  features: v.features,
  location: v.location,
  distanceKm: 2.5, // Mocked distance, frontend calculates later
  availability: v.status === 'AVAILABLE' ? 'Available now' : v.status,
  deposit: v.securityDeposit,
  prices: {
    hour: v.pricePerHour,
    day: v.pricePerDay,
  },
  image: v.images && v.images.length > 0 ? v.images[0].url : "/assets/category/image.png",
  pickupNote: v.pickupNote,
});

export const vehicleService = {
  async listVehicles(params = {}) {
    const response = await api.get('/vehicles', { params });
    // Assuming backend returns { success: true, data: [...], meta: {...} }
    return response.data.data.map(mapVehicle);
  },
  
  async getVehicleById(vehicleId) {
    const response = await api.get(`/vehicles/${vehicleId}`);
    return mapVehicle(response.data.data);
  },
};
