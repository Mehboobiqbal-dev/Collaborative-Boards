import React from 'react'
import SkeletonLoader from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  count?: number
  className?: string
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  count = 1,
  className = ''
}) => {
  return (
    <SkeletonLoader
      width={width}
      height={height}
      count={count}
      className={className}
      baseColor="#e5e7eb"
      highlightColor="#f3f4f6"
    />
  )
}

// Predefined skeleton components for common use cases
export const CardSkeleton: React.FC = () => (
  <div className="p-4 mb-2 rounded-md border">
    <Skeleton height={20} className="mb-2" />
    <Skeleton height={14} width="80%" className="mb-1" />
    <Skeleton height={14} width="60%" />
  </div>
)

export const ListSkeleton: React.FC = () => (
  <div className="min-w-72 bg-gray-50 rounded-lg p-4">
    <Skeleton height={24} width={120} className="mb-4" />
    <div className="space-y-2">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
)

export const BoardSkeleton: React.FC = () => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    <ListSkeleton />
    <ListSkeleton />
    <ListSkeleton />
  </div>
)

export default Skeleton
