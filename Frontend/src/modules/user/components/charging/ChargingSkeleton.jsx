const ChargingSkeleton = () => {
  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-28 font-sans animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="w-32 h-5 bg-gray-200 rounded" />
            <div className="w-48 h-3 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="px-5 mb-4 flex items-center gap-3">
        <div className="flex-1 h-12 bg-gray-200 rounded-[16px]" />
        <div className="w-[100px] h-12 bg-gray-200 rounded-[16px]" />
      </div>

      {/* Filter Chips Skeleton */}
      <div className="px-5 mb-5 flex items-center gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-[100px] h-[34px] bg-gray-200 rounded-full shrink-0" />
        ))}
      </div>

      {/* Map Skeleton */}
      <div className="px-5 mb-8">
        <div className="w-full h-[160px] rounded-[24px] bg-gray-200" />
      </div>

      {/* Nearby Stations Header */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-32 h-5 bg-gray-200 rounded" />
          <div className="w-24 h-3 bg-gray-200 rounded" />
        </div>
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </div>

      {/* Station Cards Skeleton */}
      <div className="px-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-[20px] border border-gray-100 p-4 flex gap-4 h-[132px]">
            <div className="w-[80px] h-full bg-gray-200 rounded-[16px] shrink-0" />
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-gray-200 rounded" />
                  <div className="w-48 h-3 bg-gray-200 rounded" />
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between items-end">
                <div className="flex gap-2">
                  <div className="w-16 h-6 bg-gray-200 rounded-lg" />
                  <div className="w-16 h-6 bg-gray-200 rounded-lg" />
                </div>
                <div className="space-y-2 flex flex-col items-end">
                  <div className="w-16 h-4 bg-gray-200 rounded" />
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChargingSkeleton;
