import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/DashboardPage.css";

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="section-title">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
          </h1>
          <p className="page-subtitle">
            Manage your trips, build packing plans, and continue your travel prep.
          </p>
        </div>

        <button className="secondary-btn dashboard-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <h3>Create a New Trip</h3>
          <p>Start a fresh trip plan with destination, weather, and suitcase setup.</p>
          <button className="primary-btn" onClick={() => navigate("/trips/new")}>
            Create Trip
          </button>
        </div>

        <div className="card dashboard-card">
          <h3>My Trips</h3>
          <p>View your saved trips, reopen them, and continue editing anytime.</p>
          <button className="secondary-btn" onClick={() => navigate("/trips")}>
            View Trips
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;