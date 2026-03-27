import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripResultsPage.css";

function TripResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setPageError("");

        const response = await api.get(`/trips/${id}/results`);
        setResultData(response.data);
      } catch (error) {
        console.error("Load trip results error:", error);
        setPageError(
          error?.response?.data?.message || "Failed to load trip results."
        );
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id]);

  const renderLayoutItems = (items = []) => {
    if (!items.length) {
      return <p className="info-text">No items assigned here.</p>;
    }

    return items.map((item, index) => (
      <div key={`${item.tripItemId || item.itemId}-${index}`} className="trip-results-layout-chip">
        {item.name} × {item.quantity}
      </div>
    ));
  };

  if (loading) {
    return <div className="page-container">Loading trip results...</div>;
  }

  if (pageError) {
    return (
      <div className="page-container">
        <div className="card trip-results-error">{pageError}</div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="page-container">
        <div className="card trip-results-error">No trip result data found.</div>
      </div>
    );
  }

  const { trip, suitcase, totals, packingOrder = [], suitcaseLayout = {}, advice = [] } =
    resultData;

  return (
    <div className="page-container">
      <div className="trip-results-header">
        <div>
          <h1 className="section-title">{trip?.tripName || "Trip Results"}</h1>
          <p className="page-subtitle">
            Review the full packing result for this trip.
          </p>
        </div>

        <button
          className="secondary-btn"
          onClick={() => navigate(`/trips/${id}`)}
        >
          Back to Trip
        </button>
      </div>

      <div className="trip-results-top-grid">
        <div className="card">
          <h2 className="trip-results-card-title">Trip</h2>
          <p><strong>Name:</strong> {trip?.tripName || "N/A"}</p>
          <p><strong>Destination:</strong> {trip?.destination || "Not set"}</p>
        </div>

        <div className="card">
          <h2 className="trip-results-card-title">Suitcase</h2>
          {suitcase ? (
            <>
              <p><strong>Name:</strong> {suitcase.name}</p>
              <p><strong>Volume:</strong> {suitcase.volumeCm3} cm³</p>
              <p><strong>Max Weight:</strong> {suitcase.maxWeightKg} kg</p>
            </>
          ) : (
            <p className="info-text">No suitcase found.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="trip-results-card-title">Totals</h2>

        <div className="trip-results-summary-grid">
          <div className="trip-results-stat">
            <div className="trip-results-stat-label">Total Volume</div>
            <div className="trip-results-stat-value">
              {totals?.totalVolumeCm3} cm³
            </div>
          </div>

          <div className="trip-results-stat">
            <div className="trip-results-stat-label">Total Weight</div>
            <div className="trip-results-stat-value">
              {totals?.weightKg} kg
            </div>
          </div>

          <div className="trip-results-stat">
            <div className="trip-results-stat-label">Used Capacity</div>
            <div className="trip-results-stat-value">
              {totals?.usedCapacityPercent}%
            </div>
          </div>

          <div className="trip-results-stat">
            <div className="trip-results-stat-label">Remaining Volume</div>
            <div className="trip-results-stat-value">
              {totals?.remainingVolumeCm3} cm³
            </div>
          </div>
        </div>

        <div className="trip-results-checks">
          <p>
            <strong>Volume Fits:</strong> {totals?.volumeFits ? "Yes" : "No"}
          </p>
          <p>
            <strong>Weight Fits:</strong> {totals?.weightFits ? "Yes" : "No"}
          </p>
          <p
            className={
              totals?.overallFits
                ? "trip-results-status-good"
                : "trip-results-status-bad"
            }
          >
            {totals?.overallFits
              ? "This packing setup should fit your suitcase."
              : "This setup may exceed your suitcase capacity."}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="trip-results-card-title">Suitcase Layout</h2>

        <div className="trip-results-layout-grid">
          <div className="trip-results-layout-box">
            <h3>Bottom Layer</h3>
            <div className="trip-results-layout-chip-list">
              {renderLayoutItems(suitcaseLayout.bottomLayer)}
            </div>
          </div>

          <div className="trip-results-layout-box">
            <h3>Middle Layer</h3>
            <div className="trip-results-layout-chip-list">
              {renderLayoutItems(suitcaseLayout.middleLayer)}
            </div>
          </div>

          <div className="trip-results-layout-box">
            <h3>Left Side</h3>
            <div className="trip-results-layout-chip-list">
              {renderLayoutItems(suitcaseLayout.leftSide)}
            </div>
          </div>

          <div className="trip-results-layout-box">
            <h3>Right Side</h3>
            <div className="trip-results-layout-chip-list">
              {renderLayoutItems(suitcaseLayout.rightSide)}
            </div>
          </div>

          <div className="trip-results-layout-box trip-results-layout-box-full">
            <h3>Fill Small Gaps</h3>
            <div className="trip-results-layout-chip-list">
              {renderLayoutItems(suitcaseLayout.cornersAndGaps)}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="trip-results-card-title">Recommended Packing Order</h2>

        {packingOrder.length === 0 ? (
          <p className="info-text">No packing order available.</p>
        ) : (
          <div className="trip-results-order-list">
            {packingOrder.map((step) => (
              <div
                key={`${step.tripItemId || step.itemId}-${step.step}`}
                className="trip-results-order-card"
              >
                <h3>
                  Step {step.step}: {step.name}
                </h3>
                <p><strong>Quantity:</strong> {step.quantity}</p>
                <p><strong>Zone:</strong> {step.zone}</p>
                <p><strong>Behavior:</strong> {step.packBehavior}</p>
                <p><strong>Instruction:</strong> {step.instruction}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="trip-results-card-title">Advice</h2>

        {advice.length === 0 ? (
          <p className="info-text">No advice available.</p>
        ) : (
          <ul className="trip-results-advice-list">
            {advice.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TripResultsPage;