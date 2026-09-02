import { Link } from "react-router-dom";

const PromoBanner = () => {
  return (
    <div className="w-full mb-8">
      <Link to="/offers" className="block w-full">
        <img 
          src="/assets/exploresectionhome.png" 
          alt="Promotional Offer" 
          className="w-full h-auto object-cover"
        />
      </Link>
    </div>
  );
};

export default PromoBanner;
