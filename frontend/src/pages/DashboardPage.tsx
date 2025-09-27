import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { getErrorMessage, showErrorToast, showSuccessToast } from '../utils/errorMessages';
import { Board } from '../types';
import { DashboardLoader } from '../components/LoadingSpinner';
import { getBoardUrl } from '../utils/urlUtils';
import PendingInvites from '../components/PendingInvites';

const DashboardPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Add a small delay to prevent overwhelming the server after login
    const timer = setTimeout(() => {
      loadBoards();
    }, 100);
    
    return () => clearTimeout(timer);
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
      
      // Show success message if boards were loaded successfully
      if (userBoards.length > 0) {
        showSuccessToast(`Welcome back! Loaded ${userBoards.length} board${userBoards.length !== 1 ? 's' : ''} from your account.`);
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
      showErrorToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;

    try {
      const board = await apiService.createBoard(newBoardTitle);
      setBoards([...boards, { ...board, members: board.members ?? [] }]);
      setNewBoardTitle('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create board:', error);
      showErrorToast(getErrorMessage(error));
    }
  };

  if (loading) {
    return <DashboardLoader />;
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
            <div>
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
                <button onClick={handleCreateBoard} className="btn btn-primary">
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <PendingInvites onInviteAccepted={loadBoards} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.isArray(boards) && boards.length > 0 ? (
          boards.map((board) => (
            <div
              key={board.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(getBoardUrl(board.id))}
            >
              <h3 className="text-lg font-semibold mb-2">{board.title}</h3>
              <p className="text-sm text-gray-600 mb-1">Owner: {board.owner?.name ?? 'Unknown'}</p>
              <p className="text-sm text-gray-600">{board.members?.length ?? 0} members</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No boards yet. Create your first board to get started!</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Your data is automatically saved and will persist even after logging out. 
                Make sure you're logging in with the same email address you used to create your boards.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;