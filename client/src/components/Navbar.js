import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import { FEEDBACK_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div>
          <Link to="/">
            <h2 className="navbar-logo">PackSmart</h2>
          </Link>
          <span className="navbar-tagline">Smart suitcase planning for travelers</span>
        </div>

        <div className="navbar-actions">
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noreferrer"
            className="navbar-feedback-btn"
          >
            Send Feedback
          </a>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-feedback-btn">
                Dashboard
              </Link>
              <button className="navbar-feedback-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-feedback-btn">
                Login
              </Link>
              <Link to="/register" className="navbar-feedback-btn">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;