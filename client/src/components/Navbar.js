import React from "react";
import "../styles/Navbar.css";
import { FEEDBACK_URL } from "../config";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div>
          <h2 className="navbar-logo">PackSmart</h2>
          <span className="navbar-tagline">Smart suitcase planning for travelers</span>
        </div>

        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noreferrer"
          className="navbar-feedback-btn"
        >
          Send Feedback
        </a>
      </div>
    </nav>
  );
}

export default Navbar;