import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import { FEEDBACK_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
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
            Feedback
          </a>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`navbar-feedback-btn ${isActive("/dashboard") ? "navbar-link-active" : ""}`}
              >
                Dashboard
              </Link>

              <Link
                to="/trips"
                className={`navbar-feedback-btn ${isActive("/trips") ? "navbar-link-active" : ""}`}
              >
                My Trips
              </Link>

              <Link
                to="/profile"
                className={`navbar-feedback-btn ${isActive("/profile") ? "navbar-link-active" : ""}`}
              >
                Profile
              </Link>
              
              <Link
                to="/saved-suitcases"
                className={`navbar-feedback-btn ${isActive("/saved-suitcases") ? "navbar-link-active" : ""}`}
              >
                Suitcases
              </Link>

              <Link
                to="/packing-templates"
                className={`navbar-feedback-btn ${isActive("/packing-templates") ? "navbar-link-active" : ""}`}
              >
                Templates
              </Link>

              <button className="navbar-feedback-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`navbar-feedback-btn ${isActive("/login") ? "navbar-link-active" : ""}`}
              >
                Login
              </Link>

              <Link
                to="/register"
                className={`navbar-feedback-btn ${isActive("/register") ? "navbar-link-active" : ""}`}
              >
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