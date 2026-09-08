import { useState } from "react";

const VehicleGallery = ({ vehicle }) => {
  const images = vehicle.images || [vehicle.image];
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="surface-card overflow-hidden p-4">
      <div className="bg-gray-50 rounded-[1.75rem] p-4 flex items-center justify-center">
        <img 
          alt={vehicle.name} 
          className="h-72 w-full object-contain mix-blend-multiply sm:h-96" 
          src={images[activeIndex]} 
        />
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {images.map((img, idx) => (
            <button 
              key={idx} 
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-16 w-16 bg-gray-50 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${activeIndex === idx ? 'border-[#FF5500]' : 'border-transparent hover:border-gray-300'}`}
            >
              <img src={img} className="h-full w-full object-cover mix-blend-multiply" alt={`${vehicle.name} ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default VehicleGallery;
