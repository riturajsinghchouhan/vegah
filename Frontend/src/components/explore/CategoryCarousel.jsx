import { Crown, LayoutGrid } from "lucide-react";

const iconMap = {
  "layout-grid": LayoutGrid,
  crown: Crown,
};

const CategoryCarousel = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="px-4 mb-8 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex items-center gap-3 w-max pb-1">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || LayoutGrid;
          const isActive = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`flex flex-col items-center justify-center rounded-2xl w-[85px] py-3.5 shadow-sm transition-all duration-200 ${
                isActive
                  ? "bg-[#FFF0EB] border border-[#FF5A1F] text-[#FF5A1F]"
                  : "bg-white border border-gray-100 text-gray-500 hover:border-gray-200"
              }`}
            >
              <div className={`mb-2 flex h-8 w-8 items-center justify-center ${isActive ? "text-[#FF5A1F]" : "text-gray-700"}`}>
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                )}
              </div>
              <span className={`text-[11px] font-bold ${isActive ? "text-[#FF5A1F]" : "text-gray-900"}`}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryCarousel;
