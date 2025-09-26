import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  text?: string
  className?: string
  fullScreen?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  className = '',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const variantClasses = {
    default: 'text-gray-600',
    primary: 'text-blue-600',
    secondary: 'text-gray-500',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}></div>
        {/* Inner ring with color */}
        <div className={`absolute top-0 left-0 ${sizeClasses[size]} border-4 border-transparent border-t-current ${variantClasses[variant]} rounded-full animate-spin`}></div>
        {/* Center dot */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 ${variantClasses[variant]} rounded-full animate-pulse`}></div>
      </div>
      {text && (
        <p className={`mt-3 text-sm font-medium ${variantClasses[variant]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

// Predefined loading components for common use cases
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" variant="primary" text={text} />
  </div>
)

export const CardLoader: React.FC = () => (
  <div className="p-4 mb-2 rounded-md border border-gray-200 bg-white">
    <LoadingSpinner size="sm" variant="default" text="Loading card..." />
  </div>
)

export const BoardLoader: React.FC = () => (
  <div className="p-4">
    <div className="mb-8">
      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 mb-4 animate-pulse"></div>
      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 mb-6 animate-pulse"></div>
      <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse"></div>
    </div>
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="min-w-72 bg-gray-50 rounded-lg p-4">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 mb-4 animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-3 bg-white rounded-md border border-gray-200">
                <LoadingSpinner size="sm" variant="default" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const AuthLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
      <LoadingSpinner size="lg" variant="primary" text="Authenticating..." />
    </div>
  </div>
)

export const DashboardLoader: React.FC = () => (
  <div className="p-6">
    <div className="mb-8">
      <div className="h-9 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-64 mb-2 animate-pulse"></div>
      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 mb-6 animate-pulse"></div>
      <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" variant="primary" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default LoadingSpinner
