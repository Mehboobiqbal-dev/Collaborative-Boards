/**
 * Utility functions for handling URL encoding/decoding of board IDs and other parameters
 */

/**
 * Safely encode a board ID for use in URLs
 * @param boardId - The board ID to encode
 * @returns The encoded board ID
 */
export const encodeBoardId = (boardId: string): string => {
  try {
    return encodeURIComponent(boardId)
  } catch (error) {
    console.error('Error encoding board ID:', error)
    return boardId
  }
}

/**
 * Safely decode a board ID from URLs
 * @param encodedBoardId - The encoded board ID from the URL
 * @returns The decoded board ID
 */
export const decodeBoardId = (encodedBoardId: string): string => {
  try {
    return decodeURIComponent(encodedBoardId)
  } catch (error) {
    console.error('Error decoding board ID:', error)
    return encodedBoardId
  }
}

/**
 * Generate a board URL with proper encoding
 * @param boardId - The board ID
 * @returns The properly encoded board URL
 */
export const getBoardUrl = (boardId: string): string => {
  return `/boards/${encodeBoardId(boardId)}`
}
