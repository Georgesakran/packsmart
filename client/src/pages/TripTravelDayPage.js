import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripTravelDayPage.css";

function TripTravelDayPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    wearOnTravelDayCount: 0,
    keepAccessibleCount: 0,
    normalCount: 0,
    wearOnTravelDay: [],
    keepAccessible: [],
    normal: [],
  });

  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadTravelDayData = useCallback(async () => {
    try {
      setLoading(true);
      setActionError("");

      const [itemsRes, summaryRes] = await Promise.all([
        api.get(`/trips/${id}/items`),
        api.get(`/trips/${id}/travel-day-summary`),
      ]);

      setItems(itemsRes.data || []);
      setSummary(
        summaryRes.data || {
          totalItems: 0,
          wearOnTravelDayCount: 0,
          keepAccessibleCount: 0,
          normalCount: 0,
          wearOnTravelDay: [],
          keepAccessible: [],
          normal: [],
        }
      );
    } catch (error) {
      console.error("Load travel day data error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to load travel day items."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTravelDayData();
  }, [loadTravelDayData]);

  const handleUpdateTravelDayMode = async (itemId, travelDayMode) => {
    try {
      setUpdatingItemId(itemId);
      setActionError("");
      setActionMessage("");

      const response = await api.put(
        `/trips/${id}/items/${itemId}/travel-day-mode`,
        { travelDayMode }
      );

      setActionMessage(
        response.data.message || "Travel day mode updated successfully."
      );

      await loadTravelDayData();
    } catch (error) {
      console.error("Update travel day mode error:", error);
      setActionError(
        error?.response?.data?.message ||
          "Failed to update travel day mode."
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const normalizedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      displayName:
        item.custom_name ||
        item.base_item_name ||
        item.name ||
        `Item #${item.item_id || item.id}`,
      travelDayMode: item.travelDayMode || item.travel_day_mode || "normal",
    }));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return normalizedItems;

    return normalizedItems.filter((item) => {
      if (filter === "wear_on_travel_day") {
        return item.travelDayMode === "wear_on_travel_day";
      }
      if (filter === "keep_accessible") {
        return item.travelDayMode === "keep_accessible";
      }
      if (filter === "normal") {
        return item.travelDayMode === "normal";
      }
      return true;
    });
  }, [normalizedItems, filter]);

  const groupedItems = useMemo(() => {
    return {
      wearOnTravelDay: filteredItems.filter(
        (item) => item.travelDayMode === "wear_on_travel_day"
      ),
      keepAccessible: filteredItems.filter(
        (item) => item.travelDayMode === "keep_accessible"
      ),
      normal: filteredItems.filter((item) => item.travelDayMode === "normal"),
    };
  }, [filteredItems]);

  const renderItemCard = (item) => (
    <div key={item.id} className="travel-day-item-card">
      <div className="travel-day-item-top">
        <div>
          <h3 className="travel-day-item-title">
            {item.displayName} × {item.quantity}
          </h3>
          <div className="travel-day-item-meta">
            <span>
              <strong>Priority:</strong> {item.priority || "recommended"}
            </span>
            <span>
              <strong>Bag:</strong>{" "}
              {item.assigned_bag_name && item.assigned_bag_role
                ? `${item.assigned_bag_name} (${item.assigned_bag_role})`
                : item.preferredBagRole
                ? `Auto / preferred: ${item.preferredBagRole}`
                : "Auto"}
            </span>
          </div>
        </div>

        <span
          className={`travel-day-mode-badge travel-day-mode-${item.travelDayMode}`}
        >
          {item.travelDayMode === "wear_on_travel_day"
            ? "wear on travel day"
            : item.travelDayMode === "keep_accessible"
            ? "keep accessible"
            : "normal"}
        </span>
      </div>

      <div className="travel-day-item-actions">
        <button
          type="button"
          className="secondary-btn"
          disabled={updatingItemId === item.id}
          onClick={() =>
            handleUpdateTravelDayMode(item.id, "wear_on_travel_day")
          }
        >
          Wear on Travel Day
        </button>

        <button
          type="button"
          className="secondary-btn"
          disabled={updatingItemId === item.id}
          onClick={() =>
            handleUpdateTravelDayMode(item.id, "keep_accessible")
          }
        >
          Keep Accessible
        </button>

        <button
          type="button"
          className="secondary-btn"
          disabled={updatingItemId === item.id}
          onClick={() => handleUpdateTravelDayMode(item.id, "normal")}
        >
          Set Normal
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="page-container">Loading travel day essentials...</div>;
  }

  return (
    <div className="page-container">
      <div className="trip-form-hero card">
        <div className="trip-form-hero-top">
          <div>
            <div className="trip-form-kicker">Trips / Travel Day</div>
            <h1 className="section-title">Travel Day Essentials</h1>
            <p className="page-subtitle">
              Decide what to wear, what to keep accessible, and what stays as
              normal packed luggage.
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
            <span className="trip-form-hero-label">Wear today</span>
            <strong className="trip-form-hero-value">
              {summary.wearOnTravelDayCount}
            </strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Keep accessible</span>
            <strong className="trip-form-hero-value">
              {summary.keepAccessibleCount}
            </strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Normal packed</span>
            <strong className="trip-form-hero-value">
              {summary.normalCount}
            </strong>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="card travel-day-success">{actionMessage}</div>
      )}

      {actionError && (
        <div className="card travel-day-error">{actionError}</div>
      )}

      <div className="card travel-day-filters-card">
        <div className="trip-form-section-header">
          <h2>Filters</h2>
          <p className="info-text">
            Focus on one travel-day group or review all items together.
          </p>
        </div>

        <div className="travel-day-filter-row">
          <button
            className={`travel-day-filter-chip ${
              filter === "all" ? "travel-day-filter-chip-active" : ""
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={`travel-day-filter-chip ${
              filter === "wear_on_travel_day"
                ? "travel-day-filter-chip-active"
                : ""
            }`}
            onClick={() => setFilter("wear_on_travel_day")}
          >
            Wear on Travel Day
          </button>

          <button
            className={`travel-day-filter-chip ${
              filter === "keep_accessible"
                ? "travel-day-filter-chip-active"
                : ""
            }`}
            onClick={() => setFilter("keep_accessible")}
          >
            Keep Accessible
          </button>

          <button
            className={`travel-day-filter-chip ${
              filter === "normal" ? "travel-day-filter-chip-active" : ""
            }`}
            onClick={() => setFilter("normal")}
          >
            Normal
          </button>
        </div>
      </div>

      <div className="travel-day-sections">
        <div className="card travel-day-section-card">
          <div className="trip-form-section-header">
            <h2>Wear on Travel Day</h2>
            <p className="info-text">
              Items you plan to wear during transit instead of packing inside a bag.
            </p>
          </div>

          {groupedItems.wearOnTravelDay.length === 0 ? (
            <div className="trip-empty-state">
              <p className="info-text">
                No items are marked to wear on travel day.
              </p>
            </div>
          ) : (
            <div className="travel-day-item-list">
              {groupedItems.wearOnTravelDay.map(renderItemCard)}
            </div>
          )}
        </div>

        <div className="card travel-day-section-card">
          <div className="trip-form-section-header">
            <h2>Keep Accessible</h2>
            <p className="info-text">
              Items you want close and easy to reach during travel.
            </p>
          </div>

          {groupedItems.keepAccessible.length === 0 ? (
            <div className="trip-empty-state">
              <p className="info-text">
                No items are marked as keep accessible.
              </p>
            </div>
          ) : (
            <div className="travel-day-item-list">
              {groupedItems.keepAccessible.map(renderItemCard)}
            </div>
          )}
        </div>

        <div className="card travel-day-section-card">
          <div className="trip-form-section-header">
            <h2>Normal Packed Items</h2>
            <p className="info-text">
              Items that stay in your normal luggage flow.
            </p>
          </div>

          {groupedItems.normal.length === 0 ? (
            <div className="trip-empty-state">
              <p className="info-text">
                No items are currently marked as normal.
              </p>
            </div>
          ) : (
            <div className="travel-day-item-list">
              {groupedItems.normal.map(renderItemCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TripTravelDayPage;