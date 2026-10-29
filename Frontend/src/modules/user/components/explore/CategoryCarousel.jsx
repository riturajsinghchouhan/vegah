import { CarFront, Crown, LayoutGrid } from "lucide-react";

const iconMap = {
  "layout-grid": LayoutGrid,
  "car": CarFront,
  "crown": Crown
};

const CategoryCarousel = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="px-4 mb-8 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex items-center gap-3 w-max pb-1">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || CarFront;
          const isActive = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`flex flex-col items-center justify-center rounded-2xl w-[85px] py-3.5 shadow-sm transition-all duration-200 ${
                isActive 
                  ? "bg-app-muted border border-[#2E7BE0] text-[#2E7BE0]" 
                  : "bg-app-card border border-app-border text-app-subtle hover:border-app-border"
              }`}
            >
              <div className={`mb-2 ${isActive ? "text-[#2E7BE0]" : "text-app-text"}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={`text-[11px] font-bold ${isActive ? "text-[#2E7BE0]" : "text-app-text"}`}>
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
