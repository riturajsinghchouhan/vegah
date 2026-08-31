import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryCarousel from "../../../../components/explore/CategoryCarousel";
import DestinationsSection from "../../../../components/explore/DestinationsSection";
import ExploreHeader from "../../../../components/explore/ExploreHeader";
import FilterBottomSheet from "../../../../components/explore/FilterBottomSheet";
import PopularCarsSection from "../../../../components/explore/PopularCarsSection";
import PromoBanner from "../../../../components/explore/PromoBanner";
import SearchAndFilter from "../../../../components/explore/SearchAndFilter";
import WhyChooseUs from "../../../../components/explore/WhyChooseUs";
import { benefits, carCategories, destinations, popularCars } from "../../../../data/exploreData";
import { useDebounce } from "../../../../hooks/useDebounce";

const VehiclesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 200);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchParams({ category: categoryId });
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    // Logic to filter cars based on filters can be added here
  };

  // Basic filtering for demo purposes
  const filteredCars = useMemo(() => {
    return popularCars.filter(car => {
      const matchesCategory = selectedCategory === "all" || car.category.toLowerCase() === selectedCategory;
      const haystack = `${car.name} ${car.category}`.toLowerCase();
      const matchesSearch = haystack.includes(debouncedSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [debouncedSearch, selectedCategory]);

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 font-sans relative">
      <ExploreHeader />
      
      <SearchAndFilter 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onOpenFilters={() => setIsFilterOpen(true)} 
      />
      
      <CategoryCarousel 
        categories={carCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
      
      <PromoBanner />
      
      <PopularCarsSection cars={filteredCars} />
      
      <WhyChooseUs benefits={benefits} />
      
      <DestinationsSection destinations={destinations} />
      
      <FilterBottomSheet 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
};

export default VehiclesPage;
