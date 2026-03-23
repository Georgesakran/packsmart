import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ResultsPage.css";

function ResultsPage() {
  const navigate = useNavigate();
  const results = JSON.parse(localStorage.getItem("packingResults"));
  const selectedSuitcase = JSON.parse(localStorage.getItem("selectedSuitcase"));
  const selectedItems = JSON.parse(localStorage.getItem("selectedItems")) || {};
  const customItems = JSON.parse(localStorage.getItem("customItems")) || [];
  const [tripName, setTripName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  if (!results) {
    return (
      <div className="page-container">
        <h1>No Results Found</h1>
        <p>Please calculate your packing first.</p>
        <button className="primary-btn" onClick={() => navigate("/suitcases")}>
          Go to Suitcases
        </button>
      </div>
    );
  }

  const {
    suitcase,
    totals,
    items,
    packingOrder = [],
    suitcaseLayout = {},
    advice,
  } = results;  

  const weightUsagePercent = Number(
    ((totals.weightKg / suitcase.maxWeightKg) * 100).toFixed(2)
  );

  const getProgressColor = (percent, fits) => {
    if (!fits || percent > 100) return "#dc2626";
    if (percent >= 85) return "#f59e0b";
    return "#16a34a";
  };

  const getUsageMessage = (percent, type) => {
    if (percent > 100) return `Your ${type} is over the limit.`;
    if (percent >= 90) return `Your ${type} is very close to the limit.`;
    if (percent >= 75) return `Your ${type} usage is getting high.`;
    return `Your ${type} usage looks comfortable.`;
  };

  const renderLayoutItems = (layoutItems = []) => {
    if (!layoutItems.length) {
      return <p style={{ margin: 0, color: "#666" }}>No items assigned here.</p>;
    }
  
    return layoutItems.map((item, index) => (
      <div key={`${item.itemId}-${index}`} className="layout-chip">
        {item.name} × {item.quantity}
      </div>
    ));
  };

  const handleSaveSession = () => {
    const trimmedName = tripName.trim();

    if (!trimmedName) {
      setSaveMessage("Please enter a trip name first.");
      return;
    }

    const existingSessions =
      JSON.parse(localStorage.getItem("packingSessions")) || [];

    const newSession = {
      id: Date.now(),
      tripName: trimmedName,
      createdAt: new Date().toISOString(),
      suitcase: selectedSuitcase || suitcase,
      results,
      selectedItems,
      customItems,
    };

    const updatedSessions = [newSession, ...existingSessions];
    localStorage.setItem("packingSessions", JSON.stringify(updatedSessions));
    setSaveMessage("Session saved successfully.");
    setTripName("");
  };

  return (
    <div className="page-container">
      <h1 className="section-title">Packing Results</h1>
      <p className="page-subtitle">
        Review your suitcase capacity, packing layout, and recommended order before you start packing.
      </p>
      <p style={{ marginTop: "-8px", marginBottom: "20px", color: "#555" }}>
        Packing plan for: <strong>{suitcase.name}</strong>
      </p>

      <div className="card no-print">
        <h2 className="section-title">Save This Session</h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Enter trip name"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              minWidth: "240px",
            }}
          />
          <button className="primary-btn" onClick={handleSaveSession}>
            Save Session
          </button>
          <button className="secondary-btn" onClick={() => navigate("/sessions")}>
            View Saved Sessions
          </button>
        </div>

        {saveMessage && (
          <p
            style={{
              marginTop: "12px",
              color: saveMessage.includes("success") ? "green" : "crimson",
            }}
          >
            {saveMessage}
          </p>
        )}
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="section-title">Suitcase</h2>
        <p><strong>{suitcase.name}</strong></p>
        <p>Volume: {suitcase.volumeCm3} cm³</p>
        <p>Max Weight: {suitcase.maxWeightKg} kg</p>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="section-title">Capacity Overview</h2>
        <div className="result-summary-grid" style={{ marginBottom: "18px" }}>
          <div className="result-summary-stat">
            <div className="result-summary-stat-label">Total Volume</div>
            <div className="result-summary-stat-value">{totals.totalVolumeCm3} cm³</div>
          </div>

          <div className="result-summary-stat">
            <div className="result-summary-stat-label">Remaining Volume</div>
            <div className="result-summary-stat-value">{totals.remainingVolumeCm3} cm³</div>
          </div>

          <div className="result-summary-stat">
            <div className="result-summary-stat-label">Used Capacity</div>
            <div className="result-summary-stat-value">{totals.usedCapacityPercent}%</div>
          </div>

          <div className="result-summary-stat">
            <div className="result-summary-stat-label">Total Weight</div>
            <div className="result-summary-stat-value">{totals.weightKg} kg</div>
          </div>
        </div>
        <div className="progress-block">
          
          <div className="progress-header">
            <span className="progress-label">Volume Usage</span>
            <span className="progress-value">
              {totals.totalVolumeCm3} / {suitcase.volumeCm3} cm³ ({totals.usedCapacityPercent}%)
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(totals.usedCapacityPercent, 100)}%`,
                backgroundColor: getProgressColor(
                  totals.usedCapacityPercent,
                  totals.volumeFits
                ),
              }}
            />
          </div>

          <div className="progress-note">
            {getUsageMessage(totals.usedCapacityPercent, "volume")}
          </div>
        </div>

        <div className="progress-block">
          <div className="progress-header">
            <span className="progress-label">Weight Usage</span>
            <span className="progress-value">
              {totals.weightKg} / {suitcase.maxWeightKg} kg ({weightUsagePercent}%)
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(weightUsagePercent, 100)}%`,
                backgroundColor: getProgressColor(
                  weightUsagePercent,
                  totals.weightFits
                ),
              }}
            />
          </div>

          <div className="progress-note">
            {getUsageMessage(weightUsagePercent, "weight")}
          </div>
        </div>
        <p style={{ fontWeight: 700, color: totals.overallFits ? "green" : "red" }}>
          {totals.overallFits
            ? "Everything should fit."
            : "This packing setup may not fit."}
        </p>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="section-title">Selected Items</h2>
        {items.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <div className="results-list">
            {items.map((item) => (
              <div key={item.itemId} className="card result-item-card">
                <h3>{item.name}</h3>
                <p>Quantity: {item.quantity}</p>
                <p>Size: {item.selectedSize || "N/A"}</p>
                <p>Volume: {item.finalVolumeCm3} cm³</p>
                <p>Weight: {item.finalWeightG} g</p>
                <p>Behavior: {item.packBehavior}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="section-title">Suitcase Layout Preview</h2>

        <div className="layout-grid">
          <div className="layout-box">
            <h3>Bottom Layer</h3>
            <div className="layout-chip-list">
              {renderLayoutItems(suitcaseLayout.bottomLayer)}
            </div>
          </div>

          <div className="layout-box">
            <h3>Middle Layer</h3>
            <div className="layout-chip-list">
              {renderLayoutItems(suitcaseLayout.middleLayer)}
            </div>
          </div>

          <div className="layout-box">
            <h3>Left Side</h3>
            <div className="layout-chip-list">
              {renderLayoutItems(suitcaseLayout.leftSide)}
            </div>
          </div>

          <div className="layout-box">
            <h3>Right Side</h3>
            <div className="layout-chip-list">
              {renderLayoutItems(suitcaseLayout.rightSide)}
            </div>
          </div>

          <div className="layout-box layout-box-full">
            <h3>Corners & Gaps</h3>
            <div className="layout-chip-list">
              {renderLayoutItems(suitcaseLayout.cornersAndGaps)}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="section-title">Recommended Packing Order</h2>

        {packingOrder.length === 0 ? (
          <p>No packing order available.</p>
        ) : (
          <div className="results-list">
            {packingOrder.map((step) => (
              <div key={`${step.itemId}-${step.step}`} className="card result-item-card">
                <h3>
                  Step {step.step}: {step.name}
                </h3>
                <p><strong>Quantity:</strong> {step.quantity}</p>
                <p><strong>Pack Zone:</strong> {step.zone}</p>
                <p><strong>Behavior:</strong> {step.packBehavior}</p>
                <p><strong>Instruction:</strong> {step.instruction}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="section-title">Packing Advice</h2>
        {advice.length === 0 ? (
          <p>No advice available.</p>
        ) : (
          <ul>
            {advice.map((tip, index) => (
              <li key={index} style={{ marginBottom: "8px" }}>
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="results-actions no-print" style={{ marginTop: "20px" }}>
        <button className="secondary-btn" onClick={() => navigate("/items")}>
          Back to Items
        </button>

        <button className="secondary-btn" onClick={() => window.print()}>
          Export / Print Plan
        </button>

        <button className="primary-btn" onClick={() => navigate("/suitcases")}>
          Start New Packing
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;