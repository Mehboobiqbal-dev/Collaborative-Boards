import React from 'react'
import { Draggable } from 'react-beautiful-dnd'
import ReactMarkdown from 'react-markdown'
import { Card } from '../types'

interface CardComponentProps {
  card: Card
  index: number
  onClick: () => void
  onDelete: () => void
}

const CardComponent: React.FC<CardComponentProps> = ({ card, index, onClick, onDelete }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided: any, snapshot: any) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 mb-2 rounded-md shadow-sm border cursor-pointer transition-all ${
            snapshot.isDragging
              ? 'bg-yellow-50 shadow-lg rotate-2 opacity-80'
              : 'bg-white hover:shadow-md'
          }`}
          onClick={() => !snapshot.isDragging && onClick()}
        >
          <h4 className="font-semibold mb-2">{card.title}</h4>
          <div className="flex justify-end -mt-2 mb-2">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
          {card.description && (
            <div className="mb-2 text-sm text-gray-600">
              <ReactMarkdown components={{
                p: ({ children }) => <p className="m-0">{children}</p>,
                h1: ({ children }) => <strong>{children}</strong>,
                h2: ({ children }) => <strong>{children}</strong>,
                h3: ({ children }) => <strong>{children}</strong>,
              }}>
                {card.description.length > 100
                  ? card.description.substring(0, 100) + '...'
                  : card.description}
              </ReactMarkdown>
            </div>
          )}
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {card.labels.map((label, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-200 rounded-full text-xs"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

export default CardComponent