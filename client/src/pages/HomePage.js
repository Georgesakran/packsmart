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
        <div className="home-badge">Trip-Based Packing Planner</div>

        <h1 className="home-title">
          Know what fits in your suitcase before you start packing.
        </h1>

        <p className="home-subtitle">
          Create a trip, add your suitcase, manage your items, and review a
          smarter packing result before you travel.
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
          <div className="home-feature-chip">Saved Suitcases</div>
          <div className="home-feature-chip">Item Planning</div>
          <div className="home-feature-chip">Smart Suggestions</div>
          <div className="home-feature-chip">Packing Results</div>
        </div>
      </div>

      <div className="card home-section-card">
        <div className="home-section-header">
          <h2>How it works</h2>
          <p className="info-text">
            A simple trip flow from setup to final packing result.
          </p>
        </div>

        <div className="home-sections-grid">
          <div className="home-info-card">
            <h3>Create a trip</h3>
            <p>
              Set the destination, timing, travel type, weather, and traveler
              count.
            </p>
          </div>

          <div className="home-info-card">
            <h3>Add a suitcase</h3>
            <p>
              Use a saved suitcase or define the size, volume, and weight limit
              for the trip.
            </p>
          </div>

          <div className="home-info-card">
            <h3>Build your item list</h3>
            <p>
              Add items manually or generate suggestions based on your trip and
              preferences.
            </p>
          </div>

          <div className="home-info-card">
            <h3>Review the result</h3>
            <p>
              See totals, layout sections, packing order, and helpful advice
              before travel.
            </p>
          </div>
        </div>
      </div>

      <div className="home-two-column-grid">
        <div className="card home-problem-card">
          <h2>Why PackSmart</h2>
          <h3>The problem</h3>
          <p>
            Many travelers pack by guesswork. That leads to overpacking, wasted
            space, and last-minute stress.
          </p>
        </div>

        <div className="card home-solution-card">
          <h2>&nbsp;</h2>
          <h3>The solution</h3>
          <p>
            PackSmart helps travelers plan their suitcase in a clearer and
            smarter way before packing starts.
          </p>
        </div>
      </div>

      <div className="card home-section-card">
        <div className="home-section-header">
          <h2>Built around your travel preferences</h2>
          <p className="info-text">
            Use your saved size, travel style, and suitcase preferences to
            generate more relevant suggestions and a smoother packing flow.
          </p>
        </div>

        <div className="home-feature-list">
          <div className="home-feature-chip">Default Size</div>
          <div className="home-feature-chip">Travel Style</div>
          <div className="home-feature-chip">Preferred Suitcase</div>
          <div className="home-feature-chip">Reusable Presets</div>
        </div>
      </div>

      <div className="card home-final-cta">
        <h2>Start planning your next trip with less guesswork.</h2>
        <p>
          Build your trip, choose your suitcase, and review your packing result
          before the trip begins.
        </p>

        <div className="home-actions">
          {isAuthenticated ? (
            <button
              className="primary-btn"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              className="primary-btn"
              onClick={() => navigate("/register")}
            >
              Start Planning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;