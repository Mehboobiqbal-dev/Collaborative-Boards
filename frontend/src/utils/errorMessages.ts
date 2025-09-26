import toast from 'react-hot-toast'

// Utility functions for user-friendly error messages

export const getErrorMessage = (error: any): string => {
  // Handle Axios errors
  if (error?.response?.data?.error) {
    return error.response.data.error
  }

  // Handle network errors
  if (error?.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your internet connection and try again.'
  }

  // Handle timeout errors
  if (error?.code === 'TIMEOUT') {
    return 'Request timed out. Please try again.'
  }

  // Handle rate limiting
  if (error?.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  // Handle authentication errors
  if (error?.response?.status === 401) {
    return 'Your session has expired. Please log in again.'
  }

  // Handle forbidden errors
  if (error?.response?.status === 403) {
    return 'You don\'t have permission to perform this action.'
  }

  // Handle not found errors
  if (error?.response?.status === 404) {
    return 'The requested resource was not found.'
  }

  // Handle server errors
  if (error?.response?.status >= 500) {
    return 'Server error. Please try again later.'
  }

  // Default error message
  return error?.message || 'An unexpected error occurred. Please try again.'
}

export const showSuccessToast = (message: string) => {
  toast.success(message)
}

export const showErrorToast = (message: string) => {
  toast.error(message)
}

export const showInfoToast = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  })
}
