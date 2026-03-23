import React from "react";

function SuitcaseCard({ suitcase, onSelect }) {
  return (
    <div className="card suitcase-card">
      <div>
        <h3>{suitcase.name}</h3>
        <p>Volume: {suitcase.volume_cm3} cm³</p>
        <p>Max Weight: {suitcase.max_weight_kg} kg</p>
      </div>

      <button className="primary-btn" onClick={() => onSelect(suitcase)}>
        Select Suitcase
      </button>
    </div>
  );
}

export default SuitcaseCard;