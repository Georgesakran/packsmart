import React, { useEffect, useMemo, useState } from "react";
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
      <div
        key={`${item.tripItemId || item.itemId}-${index}`}
        className="trip-results-layout-chip"
      >
        {item.name} × {item.quantity}
      </div>
    ));
  };

  const fitStatus = useMemo(() => {
    if (!resultData?.totals) return "unknown";
    return resultData.totals.overallFits ? "good" : "bad";
  }, [resultData]);

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

  const {
    trip,
    suitcase,
    totals,
    packingOrder = [],
    suitcaseLayout = {},
    advice = [],
    smartAdjustments = {
      mainConstraint: "none",
      warnings: [],
      adjustments: [],
      optimizationTips: [],
    },
  } = resultData;

  return (
    <div className="page-container">
      <div className="trip-results-hero card">
        <div className="trip-results-hero-top">
          <div>
            <div className="trip-results-breadcrumb">Trips / Results</div>
            <h1 className="section-title">{trip?.tripName || "Trip Results"}</h1>
            <p className="page-subtitle">
              Review the final packing result for this trip.
            </p>
          </div>

          <div
            className={
              fitStatus === "good"
                ? "trip-results-fit-badge trip-results-fit-good"
                : "trip-results-fit-badge trip-results-fit-bad"
            }
          >
            {fitStatus === "good" ? "Fits suitcase" : "Needs adjustment"}
          </div>
        </div>

        <div className="trip-results-hero-meta">
          <div className="trip-results-hero-meta-item">
            <span className="trip-results-hero-meta-label">Trip</span>
            <span className="trip-results-hero-meta-value">
              {trip?.tripName || "N/A"}
            </span>
          </div>

          <div className="trip-results-hero-meta-item">
            <span className="trip-results-hero-meta-label">Destination</span>
            <span className="trip-results-hero-meta-value">
              {trip?.destination || "Not set"}
            </span>
          </div>

          <div className="trip-results-hero-meta-item">
            <span className="trip-results-hero-meta-label">Suitcase</span>
            <span className="trip-results-hero-meta-value">
              {suitcase?.name || "No suitcase"}
            </span>
          </div>

          <div className="trip-results-hero-meta-item">
            <span className="trip-results-hero-meta-label">Max Weight</span>
            <span className="trip-results-hero-meta-value">
              {suitcase?.maxWeightKg ?? "N/A"} kg
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="trip-results-actions-header">
          <div>
            <h2 className="trip-results-card-title">Quick Actions</h2>
            <p className="info-text">
              Update your trip, suitcase, or items if anything needs adjustment.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}`)}
          >
            Back to Trip
          </button>
        </div>

        <div className="trip-results-actions-grid">
          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/items`)}
          >
            Manage Items
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/suitcase`)}
          >
            Manage Suitcase
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/edit`)}
          >
            Edit Trip
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="trip-results-card-title">Summary</h2>
        <div className="card" style={{ marginTop: "20px" }}>
          <div className="trip-results-smart-header">
            <div>
              <h2 className="trip-results-card-title">Smart Adjustments</h2>
              <p className="info-text">
                Practical guidance based on your current packing result.
              </p>
            </div>

            <div
              className={`trip-results-constraint-badge ${
                smartAdjustments.mainConstraint === "none"
                  ? "constraint-none"
                  : smartAdjustments.mainConstraint === "volume"
                  ? "constraint-volume"
                  : smartAdjustments.mainConstraint === "weight"
                  ? "constraint-weight"
                  : "constraint-both"
              }`}
            >
              Main issue: {smartAdjustments.mainConstraint}
            </div>
          </div>

          <div className="trip-results-smart-grid">
            <div className="trip-results-smart-box">
              <h3>Warnings</h3>
              {smartAdjustments.warnings?.length === 0 ? (
                <p className="info-text">No major warnings for this result.</p>
              ) : (
                <ul className="trip-results-smart-list">
                  {smartAdjustments.warnings.map((item, index) => (
                    <li key={`warning-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="trip-results-smart-box">
              <h3>Recommended Adjustments</h3>
              {smartAdjustments.adjustments?.length === 0 ? (
                <p className="info-text">No major changes are needed right now.</p>
              ) : (
                <ul className="trip-results-smart-list">
                  {smartAdjustments.adjustments.map((item, index) => (
                    <li key={`adjustment-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="trip-results-smart-box trip-results-smart-box-full">
              <h3>Optimization Tips</h3>
              {smartAdjustments.optimizationTips?.length === 0 ? (
                <p className="info-text">No extra optimization tips available.</p>
              ) : (
                <ul className="trip-results-smart-list">
                  {smartAdjustments.optimizationTips.map((item, index) => (
                    <li key={`tip-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
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

        <div
          className={
            totals?.overallFits
              ? "trip-results-status-banner trip-results-status-banner-good"
              : "trip-results-status-banner trip-results-status-banner-bad"
          }
        >
          {totals?.overallFits
            ? "This packing setup should fit your suitcase."
            : "This setup may exceed your suitcase capacity or weight limit."}
        </div>

        <div className="trip-results-checks">
          <p>
            <strong>Volume Fits:</strong> {totals?.volumeFits ? "Yes" : "No"}
          </p>
          <p>
            <strong>Weight Fits:</strong> {totals?.weightFits ? "Yes" : "No"}
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
        <h2 className="trip-results-card-title">Recommended Advice</h2>

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