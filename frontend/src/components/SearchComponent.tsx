import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { Card, User, CardFilters } from '../types'
import SearchInput from './SearchInput'

interface SearchComponentProps {
  boardId?: string
  onSearchResults?: (results: Card[]) => void
  onUserSearchResults?: (results: User[]) => void
  searchType?: 'cards' | 'users' | 'both'
  className?: string
  placeholder?: string
}

export const SearchComponent: React.FC<SearchComponentProps> = ({
  boardId,
  onSearchResults,
  onUserSearchResults,
  searchType = 'cards',
  className = '',
  placeholder = 'Search...'
}) => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [cardResults, setCardResults] = useState<Card[]>([])
  const [userResults, setUserResults] = useState<User[]>([])
  const [showResults, setShowResults] = useState(false)

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setCardResults([])
      setUserResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    setShowResults(true)

    try {
      const promises = []

      if (searchType === 'cards' || searchType === 'both') {
        const cardSearch = apiService.searchCards({
          query: searchQuery,
          boardId,
          limit: 20
        })
        promises.push(cardSearch)
      }

      if (searchType === 'users' || searchType === 'both') {
        const userSearch = apiService.searchUsers(searchQuery, boardId)
        promises.push(userSearch)
      }

      const results = await Promise.all(promises)

      if (searchType === 'cards' || searchType === 'both') {
        const cardData = results[0] as { cards: Card[] }
        setCardResults(cardData.cards || [])
        onSearchResults?.(cardData.cards || [])
      }

      if (searchType === 'users' || searchType === 'both') {
        const userData = results[searchType === 'both' ? 1 : 0] as User[]
        setUserResults(userData || [])
        onUserSearchResults?.(userData || [])
      }
    } catch (error: any) {
      console.error('Search failed:', error)
      
      // Handle timeout or connection errors gracefully
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('Backend search timed out, search functionality may be limited')
        // Don't show error to user, just return empty results
        setCardResults([])
        setUserResults([])
        onSearchResults?.([])
        onUserSearchResults?.([])
      } else {
        // For other errors, still return empty results
        setCardResults([])
        setUserResults([])
        onSearchResults?.([])
        onUserSearchResults?.([])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <SearchInput
        value={query}
        onChange={setQuery}
        onSearch={performSearch}
        placeholder={placeholder}
        className="w-full"
      />

      {showResults && query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          )}

          {!loading && (
            <>
              {(searchType === 'cards' || searchType === 'both') && cardResults.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
                    Cards ({cardResults.length})
                  </div>
                  {cardResults.map((card) => (
                    <div key={card.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium text-gray-900">{card.title}</div>
                      {card.description && (
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {card.description}
                        </div>
                      )}
                      {card.labels && card.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.labels.map((label, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(searchType === 'users' || searchType === 'both') && userResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
                    Users ({userResults.length})
                  </div>
                  {userResults.map((user) => (
                    <div key={user.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  ))}
                </div>
              )}

              {cardResults.length === 0 && userResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchComponent