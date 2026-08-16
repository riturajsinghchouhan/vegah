import { useEffect, useState } from "react";
import ChargingFilterChips from "../../components/charging/ChargingFilterChips";
import ChargingHeader from "../../components/charging/ChargingHeader";
import ChargingMap from "../../components/charging/ChargingMap";
import ChargingSkeleton from "../../components/charging/ChargingSkeleton";
import FilterBottomSheet from "../../components/charging/FilterBottomSheet";
import NearbyStations from "../../components/charging/NearbyStations";
import SearchBar from "../../components/charging/SearchBar";
import SupportBanner from "../../components/charging/SupportBanner";
import { chargingStations } from "../../data/chargingStations";

const ChargingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredStations, setFilteredStations] = useState(chargingStations);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Apply quick filters
    if (activeFilter === "all") {
      setFilteredStations(chargingStations);
    } else if (activeFilter === "dc-fast") {
      setFilteredStations(chargingStations.filter(s => s.chargingType === "DC Fast" || s.chargingType === "Ultra Fast"));
    } else if (activeFilter === "ac") {
      setFilteredStations(chargingStations.filter(s => s.chargingType === "AC"));
    } else if (activeFilter === "available") {
      setFilteredStations(chargingStations.filter(s => s.status === "Available"));
    } else if (activeFilter === "my-plug") {
      setFilteredStations(chargingStations.filter(s => s.connector === "CCS2")); // Mock logic for "my plug"
    }
  }, [activeFilter]);

  const handleApplyFilters = (filters) => {
    // Basic mock implementation of advanced filters
    let result = [...chargingStations];
    
    if (filters.type && filters.type !== "Any Type") {
      result = result.filter(s => s.chargingType === filters.type);
    }
    
    if (filters.availability && filters.availability !== "Any Availability") {
      if (filters.availability === "Available Now") {
        result = result.filter(s => s.status === "Available");
      }
    }
    
    setFilteredStations(result);
    setIsFilterOpen(false);
  };

  if (isLoading) {
    return <ChargingSkeleton />;
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-28 font-sans">
      <ChargingHeader />
      
      <SearchBar onFilterClick={() => setIsFilterOpen(true)} />
      
      <ChargingFilterChips 
        activeFilter={activeFilter} 
        setActiveFilter={setActiveFilter} 
      />
      
      <ChargingMap stations={filteredStations} />
      
      <NearbyStations stations={filteredStations} />
      
      <SupportBanner />

      <FilterBottomSheet 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default ChargingPage;
