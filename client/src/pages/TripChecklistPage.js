import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripChecklistPage.css";

function TripChecklistPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    pending: 0,
    packed: 0,
    wearOnTravelDay: 0,
    skip: 0,
    completionPercent: 0,
  });

  const [filter, setFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const loadChecklistData = useCallback(async () => {
    try {
      setLoading(true);
      setActionError("");

      const [itemsRes, summaryRes] = await Promise.all([
        api.get(`/trips/${id}/items`),
        api.get(`/trips/${id}/checklist-summary`),
      ]);

      setItems(itemsRes.data || []);
      setSummary(
        summaryRes.data || {
          totalItems: 0,
          pending: 0,
          packed: 0,
          wearOnTravelDay: 0,
          skip: 0,
          completionPercent: 0,
        }
      );
    } catch (error) {
      console.error("Load checklist data error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to load checklist."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadChecklistData();
  }, [loadChecklistData]);

  const handleUpdatePackingStatus = async (itemId, packingStatus) => {
    try {
      setUpdatingItemId(itemId);
      setActionError("");
      setActionMessage("");

      const response = await api.put(
        `/trips/${id}/items/${itemId}/packing-status`,
        { packingStatus }
      );

      setActionMessage(
        response.data.message || "Packing status updated successfully."
      );

      await loadChecklistData();
    } catch (error) {
      console.error("Update packing status error:", error);
      setActionError(
        error?.response?.data?.message ||
          "Failed to update packing status."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;

    return items.filter((item) => {
      const status = item.packingStatus || item.packing_status || "pending";

      if (filter === "pending") return status === "pending";
      if (filter === "packed") return status === "packed";
      if (filter === "travel_day") return status === "wear_on_travel_day";
      if (filter === "skip") return status === "skip";

      return true;
    });
  }, [items, filter]);

  const getStatusLabel = (item) => {
    const status = item.packingStatus || item.packing_status || "pending";

    if (status === "packed") return "packed";
    if (status === "wear_on_travel_day") return "wear on travel day";
    if (status === "skip") return "skipped";
    return "pending";
  };

  const getAssignedBagLabel = (item) => {
    if (item.assigned_bag_name && item.assigned_bag_role) {
      return `${item.assigned_bag_name} (${item.assigned_bag_role})`;
    }

    if (item.preferredBagRole) {
      return `Auto / preferred: ${item.preferredBagRole}`;
    }

    return "Auto";
  };

  if (loading) {
    return <div className="page-container">Loading checklist...</div>;
  }

  return (
    <div className="page-container">
      <div className="trip-form-hero card">
        <div className="trip-form-hero-top">
          <div>
            <div className="trip-form-kicker">Trips / Checklist</div>
            <h1 className="section-title">Packing Checklist</h1>
            <p className="page-subtitle">
              Track what is packed, what you will wear on travel day, and what
              you want to skip.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}`)}
          >
            Back to Trip
          </button>
        </div>

        <div className="trip-form-hero-grid">
          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Total items</span>
            <strong className="trip-form-hero-value">
              {summary.totalItems}
            </strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Packed</span>
            <strong className="trip-form-hero-value">
              {summary.packed}
            </strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Travel day</span>
            <strong className="trip-form-hero-value">
              {summary.wearOnTravelDay}
            </strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Skipped</span>
            <strong className="trip-form-hero-value">
              {summary.skip}
            </strong>
          </div>
        </div>
      </div>

      <div className="card checklist-progress-card">
        <div className="trip-form-section-header">
          <h2>Checklist Progress</h2>
          <p className="info-text">
            Track how close you are to completing this trip packing process.
          </p>
        </div>

        <div className="checklist-progress-bar-wrap">
          <div className="checklist-progress-bar">
            <div
              className="checklist-progress-bar-fill"
              style={{ width: `${summary.completionPercent || 0}%` }}
            />
          </div>
          <div className="checklist-progress-label">
            {summary.completionPercent || 0}% complete
          </div>
        </div>

        <div className="checklist-summary-mini-grid">
          <div className="checklist-summary-mini-card">
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </div>
          <div className="checklist-summary-mini-card">
            <span>Packed</span>
            <strong>{summary.packed}</strong>
          </div>
          <div className="checklist-summary-mini-card">
            <span>Travel Day</span>
            <strong>{summary.wearOnTravelDay}</strong>
          </div>
          <div className="checklist-summary-mini-card">
            <span>Skipped</span>
            <strong>{summary.skip}</strong>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="card packing-checklist-success">{actionMessage}</div>
      )}

      {actionError && (
        <div className="card packing-checklist-error">{actionError}</div>
      )}

      <div className="card checklist-filters-card">
        <div className="trip-form-section-header">
          <h2>Filters</h2>
          <p className="info-text">
            Narrow the checklist by the execution status you want to review.
          </p>
        </div>

        <div className="checklist-filter-row">
          <button
            className={`checklist-filter-chip ${filter === "all" ? "checklist-filter-chip-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={`checklist-filter-chip ${filter === "pending" ? "checklist-filter-chip-active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>

          <button
            className={`checklist-filter-chip ${filter === "packed" ? "checklist-filter-chip-active" : ""}`}
            onClick={() => setFilter("packed")}
          >
            Packed
          </button>

          <button
            className={`checklist-filter-chip ${filter === "travel_day" ? "checklist-filter-chip-active" : ""}`}
            onClick={() => setFilter("travel_day")}
          >
            Travel Day
          </button>

          <button
            className={`checklist-filter-chip ${filter === "skip" ? "checklist-filter-chip-active" : ""}`}
            onClick={() => setFilter("skip")}
          >
            Skipped
          </button>
        </div>
      </div>

      <div className="card checklist-items-card">
        <div className="trip-form-section-header">
          <h2>Checklist Items</h2>
          <p className="info-text">
            Mark each item as packed, travel-day, skipped, or reset it back to
            pending.
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="trip-empty-state">
            <p className="info-text">
              No items match the current checklist filter.
            </p>
          </div>
        ) : (
          <div className="checklist-items-list">
            {filteredItems.map((item) => {
              const currentStatus =
                item.packingStatus || item.packing_status || "pending";

              return (
                <div key={item.id} className="checklist-item-row">
                  <div className="checklist-item-main">
                    <div className="checklist-item-top">
                      <h3 className="checklist-item-title">
                        {item.custom_name ||
                          item.base_item_name ||
                          item.name ||
                          `Item #${item.item_id || item.id}`}{" "}
                        × {item.quantity}
                      </h3>

                      <span
                        className={`checklist-status-badge checklist-status-${currentStatus}`}
                      >
                        {getStatusLabel(item)}
                      </span>
                    </div>

                    <div className="checklist-meta-row">
                      <span>
                        <strong>Bag:</strong> {getAssignedBagLabel(item)}
                      </span>
                      <span>
                        <strong>Priority:</strong>{" "}
                        {item.priority || "recommended"}
                      </span>
                      <span>
                        <strong>Remove:</strong>{" "}
                        {item.removePriority || "medium"}
                      </span>
                    </div>
                  </div>

                  <div className="checklist-actions-row">
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={updatingItemId === item.id}
                      onClick={() =>
                        handleUpdatePackingStatus(item.id, "packed")
                      }
                    >
                      Pack
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={updatingItemId === item.id}
                      onClick={() =>
                        handleUpdatePackingStatus(
                          item.id,
                          "wear_on_travel_day"
                        )
                      }
                    >
                      Travel Day
                    </button>

                    <button
                      type="button"
                      className="trip-delete-btn"
                      disabled={updatingItemId === item.id}
                      onClick={() =>
                        handleUpdatePackingStatus(item.id, "skip")
                      }
                    >
                      Skip
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={updatingItemId === item.id}
                      onClick={() =>
                        handleUpdatePackingStatus(item.id, "pending")
                      }
                    >
                      Reset
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripChecklistPage;