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
              Continue building trips, manage packing plans, and keep everything organized in one place.
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
            Start a fresh trip with destination, travel type, weather, and suitcase planning.
          </p>
          <button className="primary-btn" onClick={() => navigate("/trips/new")}>
            Create Trip
          </button>
        </div>

        <div className="card dashboard-card">
          <h3>My Trips</h3>
          <p>
            View saved trips, continue editing, calculate results, and manage your packing flow.
          </p>
          <button className="secondary-btn" onClick={() => navigate("/trips")}>
            View Trips
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;