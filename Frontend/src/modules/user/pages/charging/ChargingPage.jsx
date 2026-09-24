import { useEffect, useState } from "react";
import ChargingHeader from "../../../../components/charging/ChargingHeader";
import ChargingMap from "../../../../components/charging/ChargingMap";
import ChargingSkeleton from "../../../../components/charging/ChargingSkeleton";
import FilterBottomSheet from "../../../../components/charging/FilterBottomSheet";
import NearbyStations from "../../../../components/charging/NearbyStations";
import SearchBar from "../../../../components/charging/SearchBar";
import SupportBanner from "../../../../components/charging/SupportBanner";
import { chargingService } from "../../../../services/chargingService";

const ChargingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredStations, setFilteredStations] = useState([]);
  const [allStations, setAllStations] = useState([]);

  useEffect(() => {
    let mounted = true;
    chargingService.listStations().then(stations => {
      if (mounted) {
        setAllStations(stations);
        setFilteredStations(stations);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Apply quick filters
    if (activeFilter === "all") {
      setFilteredStations(allStations);
    } else if (activeFilter === "dc-fast") {
      setFilteredStations(allStations.filter(s => s.chargingType === "DC Fast" || s.chargingType === "Ultra Fast"));
    } else if (activeFilter === "ac") {
      setFilteredStations(allStations.filter(s => s.chargingType === "AC"));
    } else if (activeFilter === "available") {
      setFilteredStations(allStations.filter(s => s.status === "Available"));
    } else if (activeFilter === "my-plug") {
      setFilteredStations(allStations.filter(s => s.connector === "CCS2" || s.chargingType === "Battery Swap")); // Mock logic
    }
  }, [activeFilter, allStations]);

  const handleApplyFilters = (filters) => {
    // Basic mock implementation of advanced filters
    let result = [...allStations];
    
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
