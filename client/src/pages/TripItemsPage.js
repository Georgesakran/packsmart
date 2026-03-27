import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripItemsPage.css";

function TripItemsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tripItems, setTripItems] = useState([]);
  const [baseItems, setBaseItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [addingDbItem, setAddingDbItem] = useState(false);
  const [addingCustomItem, setAddingCustomItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  const [dbForm, setDbForm] = useState({
    selectedItemId: "",
    quantity: 1,
    sizeCode: "M",
  });

  const [customForm, setCustomForm] = useState({
    customName: "",
    quantity: 1,
    category: "custom",
    audience: "unisex",
    baseVolumeCm3: "",
    baseWeightG: "",
    packBehavior: "semi-rigid",
    sizeCode: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [tripItemsRes, baseItemsRes] = await Promise.all([
        api.get(`/trips/${id}/items`),
        api.get("/items"),
      ]);

      setTripItems(tripItemsRes.data || []);
      setBaseItems(baseItemsRes.data || []);
    } catch (error) {
      console.error("Load trip items page error:", error);
      setPageError(
        error?.response?.data?.message || "Failed to load trip items."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const selectedBaseItem = useMemo(() => {
    return baseItems.find((item) => item.id === Number(dbForm.selectedItemId));
  }, [baseItems, dbForm.selectedItemId]);

  const handleDbFormChange = (field, value) => {
    setDbForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomFormChange = (field, value) => {
    setCustomForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddDatabaseItem = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionMessage("");

    if (!selectedBaseItem) {
      setActionError("Please select an item first.");
      return;
    }

    try {
      setAddingDbItem(true);

      const payload = {
        itemId: selectedBaseItem.id,
        sourceType: "database",
        quantity: Number(dbForm.quantity) || 1,
        sizeCode: selectedBaseItem.size_mode === "alpha" ? dbForm.sizeCode || "M" : null,
        category: selectedBaseItem.category,
        audience: selectedBaseItem.audience,
        baseVolumeCm3: Number(selectedBaseItem.base_volume_cm3),
        baseWeightG: Number(selectedBaseItem.base_weight_g),
        packBehavior: selectedBaseItem.pack_behavior,
      };

      const response = await api.post(`/trips/${id}/items`, payload);

      setActionMessage(response.data.message || "Item added successfully.");

      setDbForm({
        selectedItemId: "",
        quantity: 1,
        sizeCode: "M",
      });

      await loadData();
    } catch (error) {
      console.error("Add database item error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to add item."
      );
    } finally {
      setAddingDbItem(false);
    }
  };

  const handleAddCustomItem = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionMessage("");

    if (!customForm.customName.trim()) {
      setActionError("Custom item name is required.");
      return;
    }

    if (!customForm.baseVolumeCm3 || !customForm.baseWeightG) {
      setActionError("Volume and weight are required for custom items.");
      return;
    }

    try {
      setAddingCustomItem(true);

      const payload = {
        customName: customForm.customName,
        sourceType: "custom",
        quantity: Number(customForm.quantity) || 1,
        sizeCode: customForm.sizeCode || null,
        category: customForm.category || "custom",
        audience: customForm.audience || "unisex",
        baseVolumeCm3: Number(customForm.baseVolumeCm3),
        baseWeightG: Number(customForm.baseWeightG),
        packBehavior: customForm.packBehavior,
      };

      const response = await api.post(`/trips/${id}/items`, payload);

      setActionMessage(response.data.message || "Custom item added successfully.");

      setCustomForm({
        customName: "",
        quantity: 1,
        category: "custom",
        audience: "unisex",
        baseVolumeCm3: "",
        baseWeightG: "",
        packBehavior: "semi-rigid",
        sizeCode: "",
      });

      await loadData();
    } catch (error) {
      console.error("Add custom item error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to add custom item."
      );
    } finally {
      setAddingCustomItem(false);
    }
  };

  const handleDeleteItem = async (tripItemId) => {
    try {
      setDeletingItemId(tripItemId);
      setActionError("");
      setActionMessage("");

      const response = await api.delete(`/trips/${id}/items/${tripItemId}`);

      setActionMessage(response.data.message || "Item deleted successfully.");
      await loadData();
    } catch (error) {
      console.error("Delete item error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to delete item."
      );
    } finally {
      setDeletingItemId(null);
    }
  };

  if (loading) {
    return <div className="page-container">Loading trip items...</div>;
  }

  return (
    <div className="page-container">
      <div className="trip-items-page-header">
        <div>
          <h1 className="section-title">Trip Items</h1>
          <p className="page-subtitle">
            Add base items or custom items to this trip, then calculate your final packing plan.
          </p>
        </div>

        <button className="secondary-btn" onClick={() => navigate(`/trips/${id}`)}>
          Back to Trip
        </button>
      </div>

      {pageError && <div className="card trip-items-error">{pageError}</div>}
      {actionError && <div className="card trip-items-error">{actionError}</div>}
      {actionMessage && <div className="card trip-items-success">{actionMessage}</div>}

      <div className="trip-items-grid">
        <div className="card">
          <h2 className="trip-items-card-title">Add Base Item</h2>

          <form className="trip-items-form" onSubmit={handleAddDatabaseItem}>
            <div className="control-group">
              <label>Select Item</label>
              <select
                value={dbForm.selectedItemId}
                onChange={(e) => handleDbFormChange("selectedItemId", e.target.value)}
                required
              >
                <option value="">Choose item</option>
                {baseItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={dbForm.quantity}
                onChange={(e) => handleDbFormChange("quantity", e.target.value)}
                required
              />
            </div>

            {selectedBaseItem?.size_mode === "alpha" && (
              <div className="control-group">
                <label>Size</label>
                <select
                  value={dbForm.sizeCode}
                  onChange={(e) => handleDbFormChange("sizeCode", e.target.value)}
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
            )}

            <button className="primary-btn" type="submit" disabled={addingDbItem}>
              {addingDbItem ? "Adding..." : "Add Base Item"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="trip-items-card-title">Add Custom Item</h2>

          <form className="trip-items-form" onSubmit={handleAddCustomItem}>
            <div className="control-group">
              <label>Custom Name</label>
              <input
                type="text"
                value={customForm.customName}
                onChange={(e) => handleCustomFormChange("customName", e.target.value)}
                required
              />
            </div>

            <div className="control-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={customForm.quantity}
                onChange={(e) => handleCustomFormChange("quantity", e.target.value)}
                required
              />
            </div>

            <div className="control-group">
              <label>Category</label>
              <input
                type="text"
                value={customForm.category}
                onChange={(e) => handleCustomFormChange("category", e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Audience</label>
              <select
                value={customForm.audience}
                onChange={(e) => handleCustomFormChange("audience", e.target.value)}
              >
                <option value="unisex">unisex</option>
                <option value="men">men</option>
                <option value="women">women</option>
                <option value="kids">kids</option>
              </select>
            </div>

            <div className="control-group">
              <label>Volume (cm³)</label>
              <input
                type="number"
                min="1"
                value={customForm.baseVolumeCm3}
                onChange={(e) => handleCustomFormChange("baseVolumeCm3", e.target.value)}
                required
              />
            </div>

            <div className="control-group">
              <label>Weight (g)</label>
              <input
                type="number"
                min="1"
                value={customForm.baseWeightG}
                onChange={(e) => handleCustomFormChange("baseWeightG", e.target.value)}
                required
              />
            </div>

            <div className="control-group">
              <label>Pack Behavior</label>
              <select
                value={customForm.packBehavior}
                onChange={(e) => handleCustomFormChange("packBehavior", e.target.value)}
              >
                <option value="foldable">foldable</option>
                <option value="compressible">compressible</option>
                <option value="semi-rigid">semi-rigid</option>
                <option value="rigid">rigid</option>
              </select>
            </div>

            <button className="primary-btn" type="submit" disabled={addingCustomItem}>
              {addingCustomItem ? "Adding..." : "Add Custom Item"}
            </button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="trip-items-list-header">
          <div>
            <h2 className="trip-items-card-title">Current Trip Items</h2>
            <p className="info-text">
              These are the items currently linked to this trip.
            </p>
          </div>

          <button className="secondary-btn" onClick={() => navigate(`/trips/${id}`)}>
            Done
          </button>
        </div>

        {tripItems.length === 0 ? (
          <p className="info-text">No items added yet.</p>
        ) : (
          <div className="trip-items-current-list">
            {tripItems.map((item) => (
              <div key={item.id} className="trip-item-row">
                <div>
                  <h3 className="trip-item-row-title">
                    {item.custom_name || `Item #${item.item_id || item.id}`}
                  </h3>
                  <p className="trip-item-row-meta">
                    <strong>Source:</strong> {item.source_type}
                  </p>
                  <p className="trip-item-row-meta">
                    <strong>Quantity:</strong> {item.quantity}
                    {item.size_code ? ` • Size: ${item.size_code}` : ""}
                  </p>
                  <p className="trip-item-row-meta">
                    <strong>Category:</strong> {item.category || "N/A"} •{" "}
                    <strong>Behavior:</strong> {item.pack_behavior}
                  </p>
                  <p className="trip-item-row-meta">
                    <strong>Volume:</strong> {item.base_volume_cm3} cm³ •{" "}
                    <strong>Weight:</strong> {item.base_weight_g} g
                  </p>
                </div>

                <div className="trip-item-row-actions">
                  <button
                    className="trip-item-delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deletingItemId === item.id}
                  >
                    {deletingItemId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripItemsPage;