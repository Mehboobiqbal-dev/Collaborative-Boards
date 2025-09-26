import React, { useState } from 'react'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import Swal from 'sweetalert2'
import { apiService } from '../services/api'
import { List, Card } from '../types'
import { showErrorToast, getErrorMessage } from '../utils/errorMessages'
import CardComponent from '../components/CardComponent'

interface ListComponentProps {
  list: List
  onCardClick: (card: Card) => void
  onCreateCard: (listId: string) => void
  onUpdateList: (listId: string, newTitle: string) => Promise<void>
  onDeleteList: (listId: string) => Promise<void>
  creatingCardFor: string | null
}

const ListComponent: React.FC<ListComponentProps> = ({
  list,
  onCardClick,
  onCreateCard,
  onUpdateList,
  onDeleteList,
  creatingCardFor,
}) => {
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editingListTitle, setEditingListTitle] = useState(list.title)

  const startEditingList = () => {
    setEditingListId(list.id)
    setEditingListTitle(list.title)
  }

  const cancelEditingList = () => {
    setEditingListId(null)
    setEditingListTitle('')
  }

  const handleCreateCard = async () => {
    const { value: title } = await Swal.fire({
      title: 'Create New Card',
      input: 'text',
      inputLabel: 'Card Title',
      inputPlaceholder: 'Enter card title...',
      showCancelButton: true,
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Please enter a card title!'
        }
      }
    })

    if (!title) return

    try {
      const card = await apiService.createCard(list.id, { title })
      onCreateCard(list.id)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showErrorToast('List not found.')
      } else {
        showErrorToast(getErrorMessage(error))
      }
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Delete this card?')) return
    try {
      await apiService.deleteCard(cardId)
    } catch (error) {
      showErrorToast(getErrorMessage(error))
    }
  }

  return (
    <div className="min-w-72 bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        {editingListId === list.id ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onUpdateList(list.id, editingListTitle)
            }}
            className="flex-1 mr-2"
          >
            <input
              type="text"
              value={editingListTitle}
              onChange={(e) => setEditingListTitle(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
            />
          </form>
        ) : (
          <h3 className="font-semibold flex-1">{list.title}</h3>
        )}

        <div className="flex gap-1">
          {editingListId === list.id ? (
            <>
              <button
                onClick={() => onUpdateList(list.id, editingListTitle)}
                className="text-green-600 hover:text-green-800 p-1"
              >
                ✓
              </button>
              <button
                onClick={cancelEditingList}
                className="text-red-600 hover:text-red-800 p-1"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditingList}
                className="text-gray-600 hover:text-gray-800 p-1"
                title="Edit list title"
              >
                ✏️
              </button>
              <button
                onClick={() => onDeleteList(list.id)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Delete list"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
      <Droppable droppableId={list.id}>
        {(provided: any, snapshot: any) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`mb-4 min-h-12 rounded-md p-2 ${
              snapshot.isDraggingOver ? 'bg-gray-200' : 'bg-transparent'
            }`}
          >
            {(list.cards || []).map((card, index) => (
              <CardComponent
                key={card.id}
                card={card}
                index={index}
                onClick={() => onCardClick(card)}
                onDelete={() => handleDeleteCard(card.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <button
        onClick={handleCreateCard}
        className="btn btn-secondary w-full"
        disabled={creatingCardFor === list.id}
      >
        {creatingCardFor === list.id ? 'Adding...' : '+ Add Card'}
      </button>
    </div>
  )
}

export default ListComponent