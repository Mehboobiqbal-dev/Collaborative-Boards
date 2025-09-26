import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import { apiService } from '../services/api'
import { useRealTime } from '../components/RealTimeProvider'
import { useAuth } from '../hooks/useAuth'
import { Board, Card, BoardMember } from '../types'
import { showErrorToast, getErrorMessage } from '../utils/errorMessages'
import { BoardSkeleton } from '../components/Skeleton'
import SearchComponent from '../components/SearchComponent'
import ListComponent from '../components/ListComponent'
import CardModal from '../components/CardModal'
import MembersModal from '../components/MembersModal'

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Card[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    labels: [] as string[],
    assignee: '',
    dueFrom: '',
    dueTo: '',
  })
  const [filteredCards, setFilteredCards] = useState<Card[]>([])
  const [showAddList, setShowAddList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [creatingCardFor, setCreatingCardFor] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const rt = useRealTime()

  const getUserRole = (): string | null => {
    if (!user || !board) return null
    const member = board.members.find((m: BoardMember) => m.userId === user.id)
    return member ? member.role : null
  }

  const canManageMembers = (): boolean => {
    const role = getUserRole()
    return role === 'ADMIN' || board?.ownerId === user?.id
  }

  // Filter cards based on search and filters
  useEffect(() => {
    if (!board) return

    let filtered = board.lists.flatMap(list => list.cards)

    if (searchResults.length > 0) {
      filtered = searchResults
    } else if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(card =>
        card.title.toLowerCase().includes(query) ||
        card.description?.toLowerCase().includes(query)
      )
    }

    if (filters.labels.length > 0) {
      filtered = filtered.filter(card =>
        filters.labels.some(label => card.labels.includes(label))
      )
    }

    if (filters.assignee) {
      filtered = filtered.filter(card => card.assigneeId === filters.assignee)
    }

    if (filters.dueFrom) {
      const dueFrom = new Date(filters.dueFrom)
      filtered = filtered.filter(card =>
        card.dueDate && new Date(card.dueDate) >= dueFrom
      )
    }

    if (filters.dueTo) {
      const dueTo = new Date(filters.dueTo)
      filtered = filtered.filter(card =>
        card.dueDate && new Date(card.dueDate) <= dueTo
      )
    }

    setFilteredCards(filtered)
  }, [board, searchQuery, searchResults, filters])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const sourceList = board.lists.find(list => list.id === source.droppableId)
    const destList = board.lists.find(list => list.id === destination.droppableId)

    if (!sourceList || !destList) return

    const draggedCard = sourceList.cards[source.index]
    if (!draggedCard) return

    try {
      const newPosition = destination.index
      const newBoard = { ...board }
      const newSourceList = { ...sourceList }
      const newDestList = { ...destList }

      newSourceList.cards = newSourceList.cards.filter(card => card.id !== draggableId)
      const updatedCard = { ...draggedCard, listId: destination.droppableId, position: newPosition }
      newDestList.cards = [...newDestList.cards]
      newDestList.cards.splice(destination.index, 0, updatedCard)

      newBoard.lists = newBoard.lists.map(list => {
        if (list.id === source.droppableId) return newSourceList
        if (list.id === destination.droppableId) return newDestList
        return list
      })

      setBoard(newBoard)
      await apiService.moveCard(draggedCard.id, destination.droppableId, newPosition)
      rt.emitCardMove({
        cardId: draggedCard.id,
        listId: destination.droppableId,
        position: newPosition
      })
    } catch (error) {
      console.error('Failed to move card:', error)
      loadBoard()
    }
  }

  useEffect(() => {
    if (boardId) {
      loadBoard()
      rt.connectToBoard(boardId)

      rt.onCardCreated((card: Card) => {
        setBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list =>
            list.id === card.listId
              ? { ...list, cards: [...list.cards, card] }
              : list
          )
        } : null)
      })

      rt.onCardUpdated((updatedCard: Card) => {
        setBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.cards.map(card =>
              card.id === updatedCard.id ? updatedCard : card
            )
          }))
        } : null)
      })

      rt.onCardMoved((movedCard: Card) => {
        setBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.cards.filter(card => card.id !== movedCard.id)
          })).map(list =>
            list.id === movedCard.listId
              ? { ...list, cards: [...list.cards, movedCard] }
              : list
          )
        } : null)
      })

      return () => {
        rt.disconnect()
      }
    }
  }, [boardId])

  const loadBoard = async () => {
    if (!boardId) return

    try {
      const boardData = await apiService.getBoard(boardId)
      setBoard(boardData)
    } catch (error) {
      console.error('Failed to load board:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateList = async () => {
    if (!newListTitle.trim() || !board) return

    try {
      const newList = await apiService.createList(board.id, newListTitle)
      setBoard(prev => prev ? {
        ...prev,
        lists: [...prev.lists, { ...newList, cards: [] }]
      } : null)
      setNewListTitle('')
      setShowAddList(false)
    } catch (error) {
      console.error('Failed to create list:', error)
      showErrorToast(getErrorMessage(error))
    }
  }

  const handleUpdateList = async (listId: string, newTitle: string) => {
    if (!newTitle.trim() || !board) return

    try {
      await apiService.updateList(listId, { title: newTitle })
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list =>
          list.id === listId ? { ...list, title: newTitle } : list
        )
      } : null)
    } catch (error) {
      console.error('Failed to update list:', error)
      showErrorToast(getErrorMessage(error))
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? This will also delete all cards in the list.')) return

    try {
      await apiService.deleteList(listId)
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.filter(list => list.id !== listId)
      } : null)
    } catch (error) {
      console.error('Failed to delete list:', error)
      showErrorToast(getErrorMessage(error))
    }
  }

  const handleCreateCard = async (listId: string) => {
    setCreatingCardFor(listId)
    try {
      // The actual card creation is handled in ListComponent
      // This function is called after successful creation to update the board state
      await loadBoard()
    } finally {
      setCreatingCardFor(null)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <BoardSkeleton />
      </div>
    )
  }

  if (!board) {
    return <div className="p-4">Board not found</div>
  }

  return (
    <div>
      <div className="mb-8">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary mb-4">
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-6">{board.title}</h1>

        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div className="flex-1 min-w-64">
            <SearchComponent
              boardId={board?.id}
              onSearchResults={(results) => {
                setSearchResults(results)
              }}
              placeholder="Search cards..."
              searchType="cards"
              className="w-full"
              fallbackData={board?.lists.flatMap(list => list.cards) || []}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Filters {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v) && '●'}
          </button>
          {canManageMembers() && (
            <button
              onClick={() => setShowMembersModal(true)}
              className="btn btn-primary"
            >
              Manage Members
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
                <div className="space-y-1">
                  {['bug', 'feature', 'enhancement', 'urgent', 'low-priority'].map((label) => (
                    <label key={label} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.labels.includes(label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, labels: [...prev.labels, label] }))
                          } else {
                            setFilters(prev => ({ ...prev, labels: prev.labels.filter(l => l !== label) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  value={filters.assignee}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All assignees</option>
                  {board?.members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due From</label>
                <input
                  type="date"
                  value={filters.dueFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dueFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due To</label>
                <input
                  type="date"
                  value={filters.dueTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dueTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setFilters({ labels: [], assignee: '', dueFrom: '', dueTo: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Found {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.lists.map((list) => (
            <ListComponent
              key={list.id}
              list={list}
              onCardClick={setSelectedCard}
              onCreateCard={handleCreateCard}
              onUpdateList={handleUpdateList}
              onDeleteList={handleDeleteList}
              creatingCardFor={creatingCardFor}
            />
          ))}
          <div className="min-w-72">
            {showAddList ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div>
                  <input
                    type="text"
                    placeholder="Enter list title..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCreateList} className="btn btn-primary">
                      Add List
                    </button>
                    <button
                      onClick={() => {
                        setShowAddList(false)
                        setNewListTitle('')
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddList(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors w-full text-left"
              >
                + Add another list
              </button>
            )}
          </div>
        </div>
      </DragDropContext>

      {showMembersModal && (
        <MembersModal
          board={board}
          onClose={() => setShowMembersModal(false)}
          onBoardUpdate={setBoard}
        />
      )}

      {selectedCard && (
        <CardModal
          card={selectedCard}
          board={board}
          onClose={() => setSelectedCard(null)}
          onCardUpdate={(updatedCard) => {
            setBoard(prev => prev ? {
              ...prev,
              lists: prev.lists.map(list => ({
                ...list,
                cards: list.cards.map(card =>
                  card.id === updatedCard.id ? updatedCard : card
                )
              }))
            } : null)
          }}
        />
      )}
    </div>
  )
}

export default BoardPage