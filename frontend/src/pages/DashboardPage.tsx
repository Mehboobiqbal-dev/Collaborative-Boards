import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { Board } from '../types';

const DashboardPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const userBoards = await apiService.getBoards();
      console.log('Boards:', userBoards); // Debug API response
      setBoards(
        userBoards.map(board => ({
          ...board,
          members: board.members ?? [], // Default to empty array
        }))
      );
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const board = await apiService.createBoard(newBoardTitle);
      setBoards([...boards, { ...board, members: board.members ?? [] }]);
      setNewBoardTitle('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name ?? 'User'}!</h1>
        <p className="text-gray-600 mb-6">Your boards</p>
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
          Create Board
        </button>
      </div>

      {showCreateForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '400px',
            }}
          >
            <h3>Create New Board</h3>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label htmlFor="boardTitle">Board Title</label>
                <input
                  type="text"
                  id="boardTitle"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.isArray(boards) && boards.length > 0 ? (
          boards.map((board) => (
            <div
              key={board.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/boards/${board.id}`)}
            >
              <h3 className="text-lg font-semibold mb-2">{board.title}</h3>
              <p className="text-sm text-gray-600 mb-1">Owner: {board.owner?.name ?? 'Unknown'}</p>
              <p className="text-sm text-gray-600">{board.members?.length ?? 0} members</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No boards yet. Create your first board to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;