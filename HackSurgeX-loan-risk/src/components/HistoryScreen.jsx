import { useState } from 'react';
import { History, ActivitySquare, RefreshCw, Trash2, ChevronRight } from 'lucide-react';
import './HistoryScreen.css';

function HistoryScreen({ history, loading, onViewResult, onRefresh, onDeleteItem, onClearAll }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all analysis history? This cannot be undone.')) {
      onClearAll();
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteItem = (e, item) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm(`Delete analysis for ${item.soil_type}?`)) {
      onDeleteItem(item.id);
    }
  };

  if (loading) {
    return (
      <div className="screen history-screen animate-fade-in">
        <h1 className="screen-title text-gradient">Analysis History</h1>
        <div className="loading-state glass-panel">
          <div className="spinner"></div>
          <p className="text-secondary">Loading history...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="screen history-screen animate-fade-in">
        <h1 className="screen-title text-gradient mb-6">Analysis History</h1>
        <div className="empty-state glass-card">
          <div className="empty-icon-pulse">
            <History size={48} className="text-secondary" strokeWidth={1.5} />
          </div>
          <h2>No Analysis Yet</h2>
          <p className="text-tertiary">Your soil analysis history will appear here once you take your first photo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen history-screen animate-fade-in">
      <div className="header-glass mb-6">
        <h1 className="screen-title text-gradient">History</h1>
        <div className="history-actions">
          <button className="icon-btn-secondary" onClick={onRefresh} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="icon-btn-danger" onClick={handleClearAll} title="Clear All">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="history-stats glass-panel mb-6">
        <div className="stat-card">
          <ActivitySquare size={24} className="text-primary mb-2" />
          <span className="stat-value text-gradient-primary">{history.length}</span>
          <span className="stat-label text-tertiary">Total Analyses</span>
        </div>
      </div>

      <div className="history-list">
        {history.map((item, idx) => (
          <div
            key={item.id || idx}
            className="history-card glass-panel"
            onClick={() => onViewResult(item)}
          >
            <div className="history-card-inner">
              <div className="history-icon-wrapper">
                🌱
              </div>
              <div className="history-details flex-1">
                <h3>{item.soil_type}</h3>
                <p className="history-meta text-tertiary text-xs">
                  pH: {item.ph} • {new Date(item.timestamp).toLocaleDateString()}
                </p>
                <div className="history-crops mt-2">
                  {item.recommended_crops?.slice(0, 3).map((crop, i) => (
                    <span key={i} className="micro-tag">{crop}</span>
                  ))}
                </div>
              </div>
              <div className="history-card-actions">
                <button
                  className="icon-btn-ghost text-tertiary"
                  onClick={(e) => handleDeleteItem(e, item)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={20} className="text-tertiary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryScreen;
