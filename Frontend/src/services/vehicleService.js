import api from "./api";

// Map backend vehicle structure to the frontend expected structure
const mapVehicle = (v) => ({
  id: v._id || v.id,
  name: v.name,
  type: v.type,
  brand: v.brand,
  model: v.model,
  category: typeof v.category === 'object' ? (v.category?.name || "Scooter") : (v.category || v.type || "Scooter"),
  rating: v.rating || 4.8,
  reviewsCount: v.reviewsCount || 12,
  rangeKm: v.rangeKm || 90,
  battery: v.batteryCapacity || "3.7 kWh",
  chargeTime: v.chargeTime || "4 hrs",
  charging: v.chargingInfo || "Fast Charging Supported",
  seats: v.seats || 2,
  transmission: v.transmission || "Twist & Go",
  features: v.features || ["GPS Tracking", "Digital Console", "Fast Charge"],
  location: v.location || (v.zone ? (typeof v.zone === 'object' ? v.zone.name : v.zone) : "Main Station"),
  distanceKm: v.distanceKm || null,
  availability: v.status === 'AVAILABLE' ? 'Available now' : (v.status || 'Available now'),
  deposit: v.securityDeposit || 0,
  price: v.pricePerDay || v.pricePerHour || 0,
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
  pickupNote: v.pickupNote || "Helmet included. Please carry original DL.",
});

export const vehicleService = {
  async listVehicles(params = {}) {
    try {
      const response = await api.get('/vehicles', { params });
      const rawData = response.data.data;
      const list = Array.isArray(rawData) ? rawData : (rawData?.vehicles || []);
      return list.map(mapVehicle);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      throw err;
    }
  },
  
  async getVehicleById(vehicleId) {
    const response = await api.get(`/vehicles/${vehicleId}`);
    return mapVehicle(response.data.data);
  },

  async getCategories() {
    try {
      const response = await api.get('/categories');
      const rawData = response.data.data;
      return Array.isArray(rawData) ? rawData : (rawData?.categories || []);
    } catch (err) {
      try {
        const response = await api.get('/admin/categories');
        const rawData = response.data.data;
        return Array.isArray(rawData) ? rawData : (rawData?.categories || []);
      } catch (fallbackErr) {
        console.error("Error fetching categories:", fallbackErr);
        return [];
      }
    }
  },
};
