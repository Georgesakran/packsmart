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
    suitcases = [],
    totals,
    packingOrder = [],
    suitcaseLayout = {},
    advice = [],
    bagDistribution = [],
    bagRebalancingSuggestions = [],
    itemSubstitutionSuggestions = [],
    smartAdjustments = {
      mainConstraint: "none",
      warnings: [],
      adjustments: [],
      optimizationTips: [],
    },
  } = resultData;

  const getPackingHealth = () => {
    if (!totals) return "Unknown";
    if (totals.overallFits && totals.usedCapacityPercent <= 70) return "Comfortable";
    if (totals.overallFits && totals.usedCapacityPercent <= 90) return "Tight";
    return "Overloaded";
  };
  
  const getBagBalanceStatus = () => {
    if (!bagDistribution?.length) return "Unknown";
  
    const overloaded = bagDistribution.filter(
      (bag) => !bag.volumeFits || !bag.weightFits || bag.usedCapacityPercent >= 90
    ).length;
  
    if (overloaded === 0) return "Balanced";
    if (overloaded === 1) return "Needs attention";
    return "Unbalanced";
  };
  
  const getEssentialCoverage = () => {
    const essentials = [];
    const allItems = bagDistribution.flatMap((bag) => bag.items || []);
  
    if (allItems.some((item) => item.name?.toLowerCase() === "underwear")) essentials.push("Underwear");
    if (allItems.some((item) => item.name?.toLowerCase() === "socks")) essentials.push("Socks");
    if (allItems.some((item) => item.name?.toLowerCase().includes("charger"))) essentials.push("Charger");
    if (allItems.some((item) => item.name?.toLowerCase().includes("toiletry"))) essentials.push("Toiletry Bag");
  
    if (essentials.length === 4) return "Strong";
    if (essentials.length >= 2) return "Partial";
    return "Weak";
  };
  
  const getTopActionNow = () => {
    if (bagRebalancingSuggestions?.length > 0) {
      const first = bagRebalancingSuggestions[0];
      return `Move ${first.itemName} to ${first.toBag?.name}`;
    }
  
    if (smartAdjustments?.adjustments?.length > 0) {
      return smartAdjustments.adjustments[0];
    }
  
    if (smartAdjustments?.optimizationTips?.length > 0) {
      return smartAdjustments.optimizationTips[0];
    }
  
    return "No urgent action needed";
  };

  const getPrimaryBagName = () => {
    const primary = suitcases.find((bag) => bag.isPrimary);
    return primary?.name || "No primary bag";
  };
  
  const getManualAssignmentsCount = () => {
    return bagDistribution.reduce((sum, bag) => {
      const manualCount = (bag.items || []).filter(
        (item) => item.assignmentMode === "manual"
      ).length;
      return sum + manualCount;
    }, 0);
  };
  
  const getAutoAssignmentsCount = () => {
    return bagDistribution.reduce((sum, bag) => {
      const autoCount = (bag.items || []).filter(
        (item) => item.assignmentMode === "auto"
      ).length;
      return sum + autoCount;
    }, 0);
  };
  
  const getPriorityBreakdown = () => {
    const allItems = bagDistribution.flatMap((bag) => bag.items || []);
  
    const essential = allItems.filter((item) => item.priority === "essential").length;
    const recommended = allItems.filter((item) => item.priority === "recommended").length;
    const optional = allItems.filter((item) => item.priority === "optional").length;
  
    return { essential, recommended, optional };
  };
  
  const getDecisionLogicSummary = () => {
    if (itemSubstitutionSuggestions.length > 0) {
      return "Substitution logic is active because the current setup has packing pressure or optimization opportunities.";
    }
  
    if (bagRebalancingSuggestions.length > 0) {
      return "Rebalancing logic is active because some bags can be packed more evenly.";
    }
  
    if (smartAdjustments?.adjustments?.length > 0) {
      return "Adjustment logic is active because the current packing setup can still be improved.";
    }
  
    return "The current result looks stable with no major correction needed.";
  };

  const getCommandCenterStatus = () => {
    if (!totals) return "Unknown";
    if (!totals.overallFits) return "Needs Fixes";
    if (totals.usedCapacityPercent >= 85) return "Tight";
    return "Ready";
  };
  
  const getTopIssue = () => {
    if (smartAdjustments?.mainConstraint && smartAdjustments.mainConstraint !== "none") {
      return smartAdjustments.mainConstraint;
    }
  
    if (bagRebalancingSuggestions?.length > 0) {
      return "bag balance";
    }
  
    return "no major issue";
  };
  
  const getTopActionLabel = () => {
    if (bagRebalancingSuggestions?.length > 0) {
      const first = bagRebalancingSuggestions[0];
      return `Move ${first.itemName} to ${first.toBag?.name}`;
    }
  
    if (itemSubstitutionSuggestions?.length > 0) {
      const first = itemSubstitutionSuggestions[0];
  
      if (first.type === "replace") {
        return `Replace ${first.fromItem} with ${first.toItem}`;
      }
  
      if (first.type === "reduce") {
        return `Reduce ${first.itemName} to ${first.toQuantity}`;
      }
  
      if (first.type === "simplify") {
        return `Simplify ${first.fromItem}`;
      }
    }
  
    if (smartAdjustments?.adjustments?.length > 0) {
      return smartAdjustments.adjustments[0];
    }
  
    return "No urgent action needed";
  };

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
            <span className="trip-results-hero-meta-label">Bags</span>
            <span className="trip-results-hero-meta-value">
              {suitcases.length || 0}
            </span>
          </div>

          <div className="trip-results-hero-meta-item">
            <span className="trip-results-hero-meta-label">Combined Weight Limit</span>
            <span className="trip-results-hero-meta-value">
              {totals?.totalAllowedWeightG
                ? `${(totals.totalAllowedWeightG / 1000).toFixed(1)} kg`
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="card trip-command-center" style={{ marginTop: "20px" }}>
        <div className="trip-command-center-header">
          <div>
            <h2 className="trip-results-card-title">Packing Assistant Command Center</h2>
            <p className="info-text">
              Your most important packing signals and next actions in one place.
            </p>
          </div>
        </div>

        <div className="trip-command-center-grid">
          <div className="trip-command-center-card">
            <span className="trip-command-center-label">Overall Status</span>
            <strong
              className={`trip-command-center-value ${
                getCommandCenterStatus() === "Ready"
                  ? "command-status-good"
                  : getCommandCenterStatus() === "Tight"
                  ? "command-status-warning"
                  : "command-status-danger"
              }`}
            >
              {getCommandCenterStatus()}
            </strong>
            <p className="trip-command-center-text">
              Based on overall fit, packing pressure, and total used capacity.
            </p>
          </div>

          <div className="trip-command-center-card">
            <span className="trip-command-center-label">Top Issue</span>
            <strong className="trip-command-center-value command-status-neutral">
              {getTopIssue()}
            </strong>
            <p className="trip-command-center-text">
              The biggest current problem or constraint in this result.
            </p>
          </div>

          <div className="trip-command-center-card trip-command-center-card-full">
            <span className="trip-command-center-label">Top Action</span>
            <strong className="trip-command-center-value command-status-neutral">
              {getTopActionLabel()}
            </strong>
            <p className="trip-command-center-text">
              The most useful next move based on your current packing setup.
            </p>
          </div>
        </div>

        <div className="trip-command-center-actions">
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
            Manage Suitcases
          </button>

          <button
            className="primary-btn"
            onClick={() => navigate(`/trips/${id}`)}
          >
            Back to Trip
          </button>
        </div>
      </div>

      <div className="card trip-results-section-card">
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
          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/checklist`)}
          >
            Open Checklist
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
      
      <div className="card trip-results-section-card">
        <div className="trip-results-actions-header">
          <div>
            <h2 className="trip-results-card-title">Trip Intelligence Summary</h2>
            <p className="info-text">
              A quick view of the most important packing insights for this trip.
            </p>
          </div>
        </div>

        <div className="trip-intelligence-grid">
          <div className="trip-intelligence-card">
            <span className="trip-intelligence-label">Packing Health</span>
            <strong className="trip-intelligence-value">{getPackingHealth()}</strong>
            <p className="trip-intelligence-subtext">
              Based on fit status and overall used capacity.
            </p>
          </div>

          <div className="trip-intelligence-card">
            <span className="trip-intelligence-label">Main Constraint</span>
            <strong className="trip-intelligence-value">
              {smartAdjustments?.mainConstraint || "none"}
            </strong>
            <p className="trip-intelligence-subtext">
              The main pressure point in your current packing setup.
            </p>
          </div>

          <div className="trip-intelligence-card">
            <span className="trip-intelligence-label">Bag Balance</span>
            <strong className="trip-intelligence-value">{getBagBalanceStatus()}</strong>
            <p className="trip-intelligence-subtext">
              Indicates how evenly your bags are currently packed.
            </p>
          </div>

          <div className="trip-intelligence-card">
            <span className="trip-intelligence-label">Essential Coverage</span>
            <strong className="trip-intelligence-value">{getEssentialCoverage()}</strong>
            <p className="trip-intelligence-subtext">
              Based on whether key must-pack items are included.
            </p>
          </div>

          <div className="trip-intelligence-card trip-intelligence-card-full">
            <span className="trip-intelligence-label">Top Action Now</span>
            <strong className="trip-intelligence-value">{getTopActionNow()}</strong>
            <p className="trip-intelligence-subtext">
              The single most useful next move based on this result.
            </p>
          </div>
        </div>
      </div>

      <div className="card trip-results-section-card">
        <div className="trip-results-actions-header">
          <div>
            <h2 className="trip-results-card-title">Why This Result Happened</h2>
            <p className="info-text">
              A deeper explanation of the factors that shaped this packing result.
            </p>
          </div>
        </div>

        <div className="trip-explainability-grid">
          <div className="trip-explainability-card">
            <span className="trip-explainability-label">Trip Context</span>
            <strong className="trip-explainability-value">Context-driven planning</strong>
            <p className="trip-explainability-text">
              This result is shaped by your trip duration, travel type, weather, and
              traveler count. These inputs affect clothing quantities, layer logic,
              and item balance.
            </p>
          </div>

          <div className="trip-explainability-card">
            <span className="trip-explainability-label">Preference Influence</span>
            <strong className="trip-explainability-value">Profile-aware logic</strong>
            <p className="trip-explainability-text">
              Your profile settings such as size, travel style, and packing mode can
              change how many items are suggested and how conservative or light the
              setup becomes.
            </p>
          </div>

          <div className="trip-explainability-card">
            <span className="trip-explainability-label">Bag Logic</span>
            <strong className="trip-explainability-value">
              {suitcases.length} bags considered
            </strong>
            <p className="trip-explainability-text">
              The calculation used all linked trip bags together. Primary bag:{" "}
              <strong>{getPrimaryBagName()}</strong>. Manual assignments:{" "}
              <strong>{getManualAssignmentsCount()}</strong>. Auto assignments:{" "}
              <strong>{getAutoAssignmentsCount()}</strong>.
            </p>
          </div>

          <div className="trip-explainability-card">
            <span className="trip-explainability-label">Decision Logic</span>
            <strong className="trip-explainability-value">Rule-based optimization</strong>
            <p className="trip-explainability-text">
              {getDecisionLogicSummary()}
            </p>
          </div>

          <div className="trip-explainability-card trip-explainability-card-full">
            <span className="trip-explainability-label">Priority Breakdown</span>
            <div className="trip-explainability-priority-row">
              <div className="trip-explainability-priority-box">
                <span className="trip-explainability-priority-title">Essential</span>
                <strong>{getPriorityBreakdown().essential}</strong>
              </div>

              <div className="trip-explainability-priority-box">
                <span className="trip-explainability-priority-title">Recommended</span>
                <strong>{getPriorityBreakdown().recommended}</strong>
              </div>

              <div className="trip-explainability-priority-box">
                <span className="trip-explainability-priority-title">Optional</span>
                <strong>{getPriorityBreakdown().optional}</strong>
              </div>
            </div>

            <p className="trip-explainability-text" style={{ marginTop: "14px" }}>
              Priority tiers help the system decide what should stay, what can move
              between bags, and what may be reduced or substituted first.
            </p>
          </div>
        </div>
      </div>

      <div className="card trip-results-section-card">
        <div className="trip-results-actions-header">
          <div>
            <h2 className="trip-results-card-title">Trip Bags</h2>
            <p className="info-text">
              This result is calculated using all bags linked to this trip.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/suitcase`)}
          >
            Manage Suitcases
          </button>
        </div>

        {suitcases.length === 0 ? (
          <p className="info-text">No bags found for this trip.</p>
        ) : (
          <div className="trip-results-bags-grid">
            {suitcases.map((bag) => (
              <div key={bag.id} className="trip-results-bag-card">
                <h3 className="trip-results-bag-title">{bag.name}</h3>
                <p><strong>Role:</strong> {bag.bagRole}</p>
                <p><strong>Primary:</strong> {bag.isPrimary ? "Yes" : "No"}</p>
                <p><strong>Volume:</strong> {bag.volumeCm3} cm³</p>
                <p><strong>Max Weight:</strong> {bag.maxWeightKg} kg</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card trip-results-section-card">
        <div className="trip-results-actions-header">
          <div>
            <h2 className="trip-results-card-title">Bag-by-Bag Distribution</h2>
            <p className="info-text">
              See how items are distributed across the bags in this trip.
            </p>
          </div>
        </div>

        {bagDistribution.length === 0 ? (
          <p className="info-text">No bag distribution is available for this result.</p>
        ) : (
          <div className="trip-results-distribution-list">
            {bagDistribution.map((bag) => (
              <div key={bag.id} className="trip-results-distribution-card">
                <div className="trip-results-distribution-top">
                  <div>
                    <h3 className="trip-results-distribution-title">{bag.name}</h3>
                    <p className="trip-results-distribution-meta">
                      <strong>Role:</strong> {bag.bagRole}
                    </p>
                    <p className="trip-results-distribution-meta">
                      <strong>Primary:</strong> {bag.isPrimary ? "Yes" : "No"}
                    </p>
                  </div>

                  <div
                    className={`trip-results-bag-fit-badge ${
                      bag.volumeFits && bag.weightFits
                        ? "trip-results-bag-fit-good"
                        : "trip-results-bag-fit-bad"
                    }`}
                  >
                    {bag.volumeFits && bag.weightFits ? "Fits" : "Needs attention"}
                  </div>
                </div>

                <div className="trip-results-distribution-stats">
                  <div className="trip-results-distribution-stat">
                    <span className="trip-results-distribution-stat-label">Used Volume</span>
                    <strong>{bag.usedVolumeCm3} cm³</strong>
                  </div>

                  <div className="trip-results-distribution-stat">
                    <span className="trip-results-distribution-stat-label">Used Weight</span>
                    <strong>{bag.usedWeightKg} kg</strong>
                  </div>

                  <div className="trip-results-distribution-stat">
                    <span className="trip-results-distribution-stat-label">Usage</span>
                    <strong>{bag.usedCapacityPercent}%</strong>
                  </div>

                  <div className="trip-results-distribution-stat">
                    <span className="trip-results-distribution-stat-label">Remaining Volume</span>
                    <strong>{bag.remainingVolumeCm3} cm³</strong>
                  </div>
                </div>

                <div className="trip-results-distribution-items">
                  <h4>Assigned Items</h4>

                  <div className="trip-results-distribution-legend">
                    <span className="trip-results-distribution-legend-item">
                      <span className="trip-results-distribution-chip-badge chip-badge-manual">Manual</span>
                      User-selected bag
                    </span>

                    <span className="trip-results-distribution-legend-item">
                      <span className="trip-results-distribution-chip-badge chip-badge-auto">Auto</span>
                      System-assigned bag
                    </span>
                  </div>
                    
                  {bag.items?.length === 0 ? (
                    <p className="info-text">No items assigned to this bag.</p>
                  ) : (
                    <div className="trip-results-distribution-chip-list">
                      {bag.items.map((item, index) => (
                        <div
                          key={`${bag.id}-${item.tripItemId || item.itemId || index}`}
                          className="trip-results-distribution-chip trip-results-distribution-chip-rich"
                        >
                          <span className="trip-results-distribution-chip-name">
                            {item.name} × {item.quantity}
                          </span>
                          <span
                            className={`trip-results-distribution-chip-badge ${
                              item.priority === "essential"
                                ? "chip-badge-essential"
                                : item.priority === "optional"
                                ? "chip-badge-optional"
                                : "chip-badge-recommended"
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span
                            className={`trip-results-distribution-chip-badge ${
                              item.assignmentMode === "manual"
                                ? "chip-badge-manual"
                                : "chip-badge-auto"
                            }`}
                          >
                            {item.assignmentMode === "manual" ? "Manual" : "Auto"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card trip-results-section-card">
        <div className="trip-results-actions-header">
          <div>
            <h2 className="trip-results-card-title">Rebalancing Suggestions</h2>
            <p className="info-text">
              Suggested moves to improve balance across your trip bags.
            </p>
          </div>
        </div>

        {bagRebalancingSuggestions.length === 0 ? (
          <p className="info-text">
            No rebalancing suggestions are needed for this result.
          </p>
        ) : (
          <div className="trip-results-rebalance-list">
            {bagRebalancingSuggestions.map((suggestion, index) => (
              <div
                key={`rebalance-${index}`}
                className="trip-results-rebalance-card"
              >
                <div className="trip-results-rebalance-top">
                  <h3 className="trip-results-rebalance-title">
                    Move {suggestion.itemName} × {suggestion.quantity}
                  </h3>
                </div>

                <div className="trip-results-rebalance-flow">
                  <div className="trip-results-rebalance-bag">
                    <span className="trip-results-rebalance-label">From</span>
                    <strong>{suggestion.fromBag?.name}</strong>
                    <span>{suggestion.fromBag?.bagRole}</span>
                  </div>

                  <div className="trip-results-rebalance-arrow">→</div>

                  <div className="trip-results-rebalance-bag">
                    <span className="trip-results-rebalance-label">To</span>
                    <strong>{suggestion.toBag?.name}</strong>
                    <span>{suggestion.toBag?.bagRole}</span>
                  </div>
                </div>

                <p className="trip-results-rebalance-reason">
                  {suggestion.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card trip-results-section-card">
        <div className="trip-results-actions-header">
          <div>
            <h2 className="trip-results-card-title">Item Substitution Suggestions</h2>
            <p className="info-text">
              Suggested ways to simplify, reduce, or replace items in this setup.
            </p>
          </div>
        </div>

        {itemSubstitutionSuggestions.length === 0 ? (
          <p className="info-text">
            No substitution suggestions are needed for this result.
          </p>
        ) : (
          <div className="trip-results-substitution-list">
            {itemSubstitutionSuggestions.map((suggestion, index) => (
              <div
                key={`substitution-${index}`}
                className="trip-results-substitution-card"
              >
                <div className="trip-results-substitution-top">
                  <span
                    className={`trip-results-substitution-type ${
                      suggestion.type === "replace"
                        ? "substitution-replace"
                        : suggestion.type === "reduce"
                        ? "substitution-reduce"
                        : "substitution-simplify"
                    }`}
                  >
                    {suggestion.type}
                  </span>
                </div>

                {suggestion.type === "replace" && (
                  <h3 className="trip-results-substitution-title">
                    Replace {suggestion.fromItem} with {suggestion.toItem}
                  </h3>
                )}

                {suggestion.type === "reduce" && (
                  <h3 className="trip-results-substitution-title">
                    Reduce {suggestion.itemName} from {suggestion.fromQuantity} to{" "}
                    {suggestion.toQuantity}
                  </h3>
                )}

                {suggestion.type === "simplify" && (
                  <h3 className="trip-results-substitution-title">
                    Simplify {suggestion.fromItem} into {suggestion.toItem}
                  </h3>
                )}

                <p className="trip-results-substitution-reason">
                  {suggestion.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card trip-results-section-card">
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

          <div className="trip-results-stat">
            <div className="trip-results-stat-label">Combined Bag Volume</div>
            <div className="trip-results-stat-value">
              {totals?.totalAvailableVolumeCm3} cm³
            </div>
          </div>

          <div className="trip-results-stat">
            <div className="trip-results-stat-label">Combined Weight Limit</div>
            <div className="trip-results-stat-value">
              {totals?.totalAllowedWeightG
                ? `${(totals.totalAllowedWeightG / 1000).toFixed(1)} kg`
                : "N/A"}
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
            ? "This packing setup should fit within your combined trip bags."
            : "This setup may exceed your combined bag capacity or weight limit."}
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



      <div className="card trip-results-section-card">
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

      <div className="card trip-results-section-card">
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

      <div className="card trip-results-section-card">
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