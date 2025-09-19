"use client";

export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${sizeClasses[size]} ${className}`} />
  );
};

export const LoadingDots = ({ className = "" }) => {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

export const StoryLoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Left: Visual skeleton */}
        <div className="relative overflow-hidden rounded-xl border bg-gray-200 min-h-[260px] md:min-h-[360px]">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-6">
            <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 bg-gray-300 rounded-lg" />
          </div>
        </div>

        {/* Right: Text skeleton */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="h-8 bg-gray-300 rounded mb-4 w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full" />
              <div className="h-4 bg-gray-300 rounded w-5/6" />
              <div className="h-4 bg-gray-300 rounded w-4/5" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="h-12 bg-gray-300 rounded w-full sm:w-24" />
            <div className="h-12 bg-gray-300 rounded w-full sm:w-28" />
            <div className="h-12 bg-gray-300 rounded w-full sm:w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const GenerationProgress = ({ stage = "text" }) => {
  const stages = [
    { key: "text", label: "Generating story...", icon: "📝" },
    { key: "images", label: "Creating illustrations...", icon: "🎨" },
    { key: "complete", label: "Finalizing...", icon: "✨" }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === stage);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <LoadingSpinner size="sm" />
        <span className="text-blue-800 font-medium">Creating your story...</span>
      </div>
      
      <div className="space-y-2">
        {stages.map((stageItem, index) => (
          <div 
            key={stageItem.key}
            className={`flex items-center gap-2 text-sm ${
              index <= currentStageIndex 
                ? 'text-blue-700' 
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{stageItem.icon}</span>
            <span>{stageItem.label}</span>
            {index === currentStageIndex && <LoadingDots />}
            {index < currentStageIndex && <span className="text-green-600">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
