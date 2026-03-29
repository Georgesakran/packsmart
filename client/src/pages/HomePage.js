import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import { FEEDBACK_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="page-container home-page">
      <div className="home-hero card">
        <div className="home-badge">PackSmart V2</div>

        <h1 className="home-title">
          Plan your suitcase before you start packing.
        </h1>

        <p className="home-subtitle">
          Create trips, add a suitcase, manage items, generate suggestions, and
          calculate a smarter packing plan in one flow.
        </p>

        <div className="home-actions">
          {isAuthenticated ? (
            <>
              <button
                className="primary-btn"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </button>

              <button
                className="secondary-btn"
                onClick={() => navigate("/trips")}
              >
                Open My Trips
              </button>
            </>
          ) : (
            <>
              <button
                className="primary-btn"
                onClick={() => navigate("/register")}
              >
                Start Planning
              </button>

              <button
                className="secondary-btn"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </>
          )}

          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noreferrer"
            className="secondary-btn home-link-btn"
          >
            Send Feedback
          </a>
        </div>

        <div className="home-feature-list">
          <div className="home-feature-chip">Trips</div>
          <div className="home-feature-chip">Suitcase Planning</div>
          <div className="home-feature-chip">Item Management</div>
          <div className="home-feature-chip">Suggestions</div>
          <div className="home-feature-chip">Packing Results</div>
        </div>
      </div>

      <div className="home-sections-grid">
        <div className="card home-info-card">
          <h3>Create a trip</h3>
          <p>
            Set the destination, timing, travel type, weather, and traveler
            count.
          </p>
        </div>

        <div className="card home-info-card">
          <h3>Add your suitcase</h3>
          <p>
            Define the volume, weight limit, and dimensions used for the trip.
          </p>
        </div>

        <div className="card home-info-card">
          <h3>Build your item list</h3>
          <p>
            Add base items, create custom items, or generate suggestions
            automatically.
          </p>
        </div>

        <div className="card home-info-card">
          <h3>Calculate and review</h3>
          <p>
            See packing totals, layout sections, order, and advice before the
            trip.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;