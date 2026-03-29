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
      <div className="dashboard-hero card">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-kicker">Dashboard</div>
            <h1 className="section-title">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
            </h1>
            <p className="page-subtitle">
              Create trips, manage suitcase plans, and continue where you left off.
            </p>
          </div>

          <button className="secondary-btn dashboard-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="dashboard-mini-grid">
          <div className="dashboard-mini-card">
            <span className="dashboard-mini-label">Account</span>
            <strong className="dashboard-mini-value">
              {user?.email || "Signed in"}
            </strong>
          </div>

          <div className="dashboard-mini-card">
            <span className="dashboard-mini-label">Next step</span>
            <strong className="dashboard-mini-value">Create or open a trip</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <h3>Create a New Trip</h3>
          <p>
            Start a new trip with destination, timing, weather, and packing setup.
          </p>
          <button className="primary-btn" onClick={() => navigate("/trips/new")}>
            Create Trip
          </button>
        </div>

        <div className="card dashboard-card">
          <h3>My Trips</h3>
          <p>
            Open saved trips, update details, and continue your packing plan.
          </p>
          <button className="secondary-btn" onClick={() => navigate("/trips")}>
            View Trips
          </button>
        </div>

        <div className="card dashboard-card">
          <h3>Profile & Preferences</h3>
          <p>
            Update your size, travel style, and planning preferences for smarter suggestions.
          </p>
          <button className="secondary-btn" onClick={() => navigate("/profile")}>
            Open Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;