import React from 'react'

interface SkeletonLoaderProps {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button' | 'page'
  className?: string
  count?: number
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'default', 
  className = '', 
  count = 1 
}) => {
  const skeletonBase = "animate-pulse bg-gray-200 rounded"
  
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`p-4 border border-gray-200 rounded-lg shadow-sm ${className}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 ${skeletonBase}`}></div>
              <div className="flex-1">
                <div className={`h-4 w-3/4 ${skeletonBase} mb-2`}></div>
                <div className={`h-3 w-1/2 ${skeletonBase}`}></div>
              </div>
            </div>
            <div className={`h-3 w-full ${skeletonBase} mb-2`}></div>
            <div className={`h-3 w-2/3 ${skeletonBase}`}></div>
          </div>
        )
      
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className={`h-4 w-full ${skeletonBase}`}></div>
            <div className={`h-4 w-5/6 ${skeletonBase}`}></div>
            <div className={`h-4 w-4/6 ${skeletonBase}`}></div>
          </div>
        )
      
      case 'avatar':
        return <div className={`w-10 h-10 ${skeletonBase} ${className}`}></div>
      
      case 'button':
        return <div className={`h-10 w-24 ${skeletonBase} ${className}`}></div>
      
      case 'page':
        return (
          <div className={`min-h-screen bg-gray-50 p-6 ${className}`}>
            <div className="max-w-7xl mx-auto">
              {/* Header skeleton */}
              <div className="mb-8">
                <div className={`h-8 w-64 ${skeletonBase} mb-4`}></div>
                <div className={`h-4 w-96 ${skeletonBase}`}></div>
              </div>
              
              {/* Content grid skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 ${skeletonBase}`}></div>
                      <div className="flex-1">
                        <div className={`h-4 w-3/4 ${skeletonBase} mb-2`}></div>
                        <div className={`h-3 w-1/2 ${skeletonBase}`}></div>
                      </div>
                    </div>
                    <div className={`h-3 w-full ${skeletonBase} mb-2`}></div>
                    <div className={`h-3 w-2/3 ${skeletonBase} mb-4`}></div>
                    <div className="flex space-x-2">
                      <div className={`h-6 w-16 ${skeletonBase}`}></div>
                      <div className={`h-6 w-20 ${skeletonBase}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className={`flex items-center space-x-3 ${className}`}>
            <div className={`w-10 h-10 ${skeletonBase}`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-3/4 ${skeletonBase}`}></div>
              <div className={`h-3 w-1/2 ${skeletonBase}`}></div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-full">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={count > 1 ? "mb-4" : ""}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  )
}

export default SkeletonLoader
