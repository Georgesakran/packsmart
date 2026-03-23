import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SavedSessionsPage.css";

function SavedSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(() => {
    return JSON.parse(localStorage.getItem("packingSessions")) || [];
  });

  const sortedSessions = useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [sessions]);

  const handleDelete = (id) => {
    const updated = sessions.filter((session) => session.id !== id);
    setSessions(updated);
    localStorage.setItem("packingSessions", JSON.stringify(updated));
  };

  const handleLoad = (session) => {
    localStorage.setItem("selectedSuitcase", JSON.stringify(session.suitcase));
    localStorage.setItem("packingResults", JSON.stringify(session.results));
    localStorage.setItem("selectedItems", JSON.stringify(session.selectedItems));
    localStorage.setItem("customItems", JSON.stringify(session.customItems));
    navigate("/results");
  };

  return (
    <div className="page-container">
      <h1 className="section-title">Saved Sessions</h1>
      <p className="page-subtitle">
        Reopen previous packing plans, compare trips, or remove sessions you no longer need.
      </p>

      {sortedSessions.length === 0 ? (
        <div className="card">
          <p>No saved sessions yet.</p>
        </div>
      ) : (
        <div className="saved-sessions-list">
          {sortedSessions.map((session) => (
            <div key={session.id} className="card saved-session-card">
              <h3>{session.tripName}</h3>
              <p><strong>Suitcase:</strong> {session.suitcase.name}</p>
              <p>
                <strong>Capacity Used:</strong>{" "}
                {session.results.totals.usedCapacityPercent}%
              </p>
              <p>
                <strong>Total Weight:</strong> {session.results.totals.weightKg} kg
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {session.results.totals.overallFits ? "Fits" : "May not fit"}
              </p>
              <p className="saved-session-date">
                {new Date(session.createdAt).toLocaleString()}
              </p>

              <div className="saved-session-actions">
                <button className="secondary-btn" onClick={() => handleLoad(session)}>
                  Load
                </button>
                <button className="primary-btn" onClick={() => handleDelete(session.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedSessionsPage;