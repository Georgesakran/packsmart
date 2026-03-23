import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import { FEEDBACK_URL } from "../config";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page-container home-page">
      <div className="home-hero">
        <div className="home-badge">Travel packing made easier</div>

        <h1 className="home-title">Pack smarter. Fit more. Stress less.</h1>

        <p className="home-subtitle">
          Plan your suitcase, estimate space and weight, get packing advice,
          and build a smarter packing order before your trip even starts.
        </p>

        <div className="home-actions">
          <button className="primary-btn" onClick={() => navigate("/suitcases")}>
            Start Packing
          </button>

          <button className="secondary-btn" onClick={() => navigate("/sessions")}>
            View Saved Sessions
          </button>

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
          <div className="home-feature-chip">Suitcase presets</div>
          <div className="home-feature-chip">Custom items</div>
          <div className="home-feature-chip">Trip presets</div>
          <div className="home-feature-chip">Packing layout preview</div>
          <div className="home-feature-chip">Export / Print plan</div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;