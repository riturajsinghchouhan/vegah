const VehicleGallery = ({ vehicle }) => (
  <section className="surface-card overflow-hidden p-4">
    <img alt={vehicle.name} className="h-72 w-full rounded-[1.75rem] object-cover sm:h-96" src={vehicle.image} />
  </section>
);

export default VehicleGallery;
