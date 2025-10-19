'use client'

export function PublicOrderLoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 mx-auto"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-green-600 border-r-emerald-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-lg font-medium text-gray-800 animate-pulse">
            Loading Order Summary...
          </p>
          <p className="text-sm text-gray-600">?? Preparing your complete order details</p>
        </div>
        <div className="mt-8 space-y-3 max-w-md mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
