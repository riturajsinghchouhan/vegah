import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, RefreshCw, SearchX } from "lucide-react";
import CategoryCarousel from "../../../../components/explore/CategoryCarousel";
import DestinationsSection from "../../../../components/explore/DestinationsSection";
import ExploreHeader from "../../../../components/explore/ExploreHeader";
import ExploreCarCard from "../../../../components/explore/ExploreCarCard";
import FilterBottomSheet from "../../../../components/explore/FilterBottomSheet";
import PromoBanner from "../../../../components/explore/PromoBanner";
import SearchAndFilter from "../../../../components/explore/SearchAndFilter";
import WhyChooseUs from "../../../../components/explore/WhyChooseUs";
import { benefits, destinations } from "../../../../data/exploreData";
import { useDebounce } from "../../../../hooks/useDebounce";
import { vehicleService } from "../../../../services/vehicleService";

const VehicleSkeletonCard = () => (
  <div className="bg-white rounded-[20px] border border-gray-100 p-3.5 animate-pulse">
    <div className="h-[100px] bg-gray-100 rounded-xl mb-3" />
    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
    <div className="flex gap-2 mb-3">
      <div className="h-3 bg-gray-100 rounded w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
    <div className="h-5 bg-gray-100 rounded w-2/3" />
  </div>
);

const VehiclesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 200);

  const fetchVehiclesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vehiclesData, categoriesData] = await Promise.all([
        vehicleService.listVehicles(),
        vehicleService.getCategories(),
      ]);
      setVehicles(vehiclesData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error("Failed to fetch vehicles or categories:", err);
      setError("Unable to load vehicles right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesData();
  }, []);

  const formattedCategories = useMemo(() => {
    const defaultAll = { id: "all", _id: "all", name: "All Scoots", icon: "layout-grid" };
    if (!categories || categories.length === 0) {
      return [defaultAll];
    }
    const mapped = categories.map((cat) => ({
      id: cat._id || cat.id || cat.name?.toLowerCase(),
      _id: cat._id || cat.id,
      name: cat.name,
      icon: "scoot",
      image: cat.image || "/assets/category/image.png",
    }));
    return [defaultAll, ...mapped];
  }, [categories]);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === "all") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: categoryId });
    }
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setActiveFilters(null);
    setSearchParams({});
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((car) => {
      // 1. Category Filter
      let matchesCategory = true;
      if (selectedCategory !== "all") {
        const catName = typeof car.category === "object" ? car.category?.name : car.category;
        const catId = car.categoryId || car.category?._id || car.category;
        matchesCategory =
          catId === selectedCategory ||
          (catName && catName.toLowerCase() === selectedCategory.toLowerCase()) ||
          (car.type && car.type.toLowerCase() === selectedCategory.toLowerCase());
      }

      // 2. Search Term Filter
      let matchesSearch = true;
      if (debouncedSearch.trim() !== "") {
        const searchLower = debouncedSearch.toLowerCase().trim();
        const catName = typeof car.category === "object" ? car.category?.name : (car.category || "");
        const haystack = `${car.name || ""} ${catName} ${car.brand || ""} ${car.model || ""} ${car.type || ""}`.toLowerCase();
        matchesSearch = haystack.includes(searchLower);
      }

      // 3. Bottom Sheet Filters
      let matchesFilters = true;
      if (activeFilters) {
        if (activeFilters.carType && activeFilters.carType.length > 0) {
          const typeMatches = activeFilters.carType.some((t) => {
            const catName = typeof car.category === "object" ? car.category?.name : (car.category || "");
            return (
              (car.type && car.type.toLowerCase().includes(t.toLowerCase())) ||
              catName.toLowerCase().includes(t.toLowerCase())
            );
          });
          if (!typeMatches) matchesFilters = false;
        }

        if (activeFilters.price && activeFilters.price.length > 0 && matchesFilters) {
          const carPrice = car.prices?.day || car.price || 0;
          const priceMatches = activeFilters.price.some((pRange) => {
            if (pRange.includes("Under Rs 1,000")) return carPrice < 1000;
            if (pRange.includes("1,000-Rs 1,500")) return carPrice >= 1000 && carPrice <= 1500;
            if (pRange.includes("1,500+")) return carPrice > 1500;
            return true;
          });
          if (!priceMatches) matchesFilters = false;
        }
      }

      return matchesCategory && matchesSearch && matchesFilters;
    });
  }, [vehicles, debouncedSearch, selectedCategory, activeFilters]);

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 font-sans relative">
      <ExploreHeader />
      
      <SearchAndFilter 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onOpenFilters={() => setIsFilterOpen(true)} 
      />
      
      <CategoryCarousel 
        categories={formattedCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />
      
      <PromoBanner />
      
      {/* Vehicles Grid Section */}
      <div className="mb-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-gray-900">Explore EV Fleet</h2>
            {!loading && (
              <span className="text-[11px] font-semibold bg-[#FFF0EB] text-[#FF5A1F] px-2 py-0.5 rounded-full">
                {filteredVehicles.length} available
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <VehicleSkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center shadow-sm my-4">
            <AlertCircle className="mx-auto text-amber-500 mb-2" size={36} />
            <p className="text-sm font-semibold text-gray-800 mb-1">{error}</p>
            <button
              onClick={fetchVehiclesData}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#FF5A1F] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#E64D00] transition-colors"
            >
              <RefreshCw size={14} /> Retry Loading
            </button>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm my-4">
            <SearchX className="mx-auto text-gray-300 mb-3" size={44} />
            <h3 className="text-base font-bold text-gray-800 mb-1">No Vehicles Found</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              We couldn't find any vehicles matching your search or filters. Try clearing your search parameters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredVehicles.map((car) => (
              <ExploreCarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>

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
