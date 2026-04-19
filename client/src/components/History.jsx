import React, { useState } from 'react';
import { getHistory } from '../api';

export default function History() {
  const [history, setHistory] = useState([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleHistory = async () => {
    if (!show) {
      setLoading(true);
      try {
        const { data } = await getHistory();
        setHistory(data);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    setShow(!show);
  };

  return (
    <div>
      <div className="history-toggle">
        <button type="button" onClick={toggleHistory}>
          {show ? 'Hide History' : 'View Recent Searches'}
        </button>
      </div>

      {show && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '1rem', fontSize: '1rem' }}>
            Recent Recommendations
          </h2>
          {loading && <p style={{ color: '#94a3b8' }}>Loading...</p>}
          {!loading && history.length === 0 && (
            <p style={{ color: '#94a3b8' }}>No history found.</p>
          )}
          {history.map((item) => (
            <div key={item._id} className="history-item">
              <div>Skills: <span>{item.skills.join(', ')}</span></div>
              <div>Careers: <span>{item.careers.join(', ')}</span></div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
