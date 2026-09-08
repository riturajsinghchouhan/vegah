import api from "./api";

// Map backend vehicle structure to the frontend expected structure
const mapVehicle = (v) => ({
  id: v._id,
  name: v.name,
  type: v.type,
  brand: v.brand,
  model: v.model,
  rating: v.rating || 0,
  reviewsCount: v.reviewsCount || 0,
  rangeKm: v.rangeKm,
  battery: v.batteryCapacity,
  chargeTime: v.chargeTime,
  charging: v.chargingInfo,
  seats: v.seats,
  features: v.features || [],
  location: v.location,
  distanceKm: v.distanceKm || null,
  availability: v.status === 'AVAILABLE' ? 'Available now' : v.status,
  deposit: v.securityDeposit || 0,
  prices: {
    hour: v.pricePerHour || 0,
    day: v.pricePerDay || 0,
  },
  image: v.images && v.images.length > 0 
    ? (v.images[0].url.startsWith('http') ? v.images[0].url : `http://localhost:5000${v.images[0].url}`) 
    : "/assets/category/image.png",
  images: v.images && v.images.length > 0 
    ? v.images.map(img => img.url.startsWith('http') ? img.url : `http://localhost:5000${img.url}`) 
    : ["/assets/category/image.png"],
  pickupNote: v.pickupNote,
});

export const vehicleService = {
  async listVehicles(params = {}) {
    const response = await api.get('/vehicles', { params });
    return response.data.data.map(mapVehicle);
  },
  
  async getVehicleById(vehicleId) {
    const response = await api.get(`/vehicles/${vehicleId}`);
    return mapVehicle(response.data.data);
  },

  async getCategories() {
    const response = await api.get('/admin/categories');
    return response.data.data || [];
  },
};
