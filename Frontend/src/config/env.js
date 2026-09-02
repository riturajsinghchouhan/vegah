export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  mapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? "",
};
