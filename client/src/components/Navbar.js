import React from "react";
import "../styles/Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <h2 className="navbar-logo">Luggix 3D</h2>
        <span className="navbar-tagline">Smart suitcase planning for travelers</span>
      </div>
    </nav>
  );
}

export default Navbar;