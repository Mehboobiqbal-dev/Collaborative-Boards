import React from 'react'

interface SkeletonLoaderProps {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button'
  className?: string
  count?: number
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'default', 
  className = '', 
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`skeleton-card ${className}`}>
            <div className="skeleton skeleton-avatar"></div>
            <div className="skeleton-content">
              <div className="skeleton skeleton-text skeleton-text-title"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text skeleton-text-short"></div>
            </div>
          </div>
        )
      
      case 'text':
        return (
          <div className={`skeleton-text-container ${className}`}>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text skeleton-text-short"></div>
          </div>
        )
      
      case 'avatar':
        return <div className={`skeleton skeleton-avatar ${className}`}></div>
      
      case 'button':
        return <div className={`skeleton skeleton-button ${className}`}></div>
      
      default:
        return (
          <div className={`skeleton-container ${className}`}>
            <div className="skeleton skeleton-avatar"></div>
            <div className="skeleton-content">
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="skeleton-wrapper">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-item">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  )
}

export default SkeletonLoader
