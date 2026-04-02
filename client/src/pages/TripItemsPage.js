import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripItemsPage.css";

function TripItemsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileInfo, setProfileInfo] = useState(null);
  const [tripItems, setTripItems] = useState([]);
  const [baseItems, setBaseItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [addingDbItem, setAddingDbItem] = useState(false);
  const [addingCustomItem, setAddingCustomItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);


  const [packingTemplates, setPackingTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  const [clearingItems, setClearingItems] = useState(false);

  const [tripSuitcases, setTripSuitcases] = useState([]);
  const [assigningBagItemId, setAssigningBagItemId] = useState(null);

  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({
    customName: "",
    quantity: 1,
    sizeCode: "",
    category: "",
    audience: "unisex",
    baseVolumeCm3: "",
    baseWeightG: "",
    packBehavior: "semi-rigid",
  });
  const [savingEdit, setSavingEdit] = useState(false);

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const [tripItemsRes, baseItemsRes, profileRes, templatesRes, tripSuitcasesRes] =
      await Promise.all([
        api.get(`/trips/${id}/items`),
        api.get("/items"),
        api.get("/users/profile"),
        api.get("/packing-templates"),
        api.get(`/trips/${id}/suitcases`),
      ]);
      setProfileInfo(profileRes.data || null);
      setTripItems(tripItemsRes.data || []);
      setBaseItems(baseItemsRes.data || []);
      setPackingTemplates(templatesRes.data || []);
      setTripSuitcases(tripSuitcasesRes.data || []);
    } catch (error) {
      console.error("Load trip items page error:", error);
      setPageError(
        error?.response?.data?.message || "Failed to load trip items."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const startEditingItem = (item) => {
    setActionError("");
    setActionMessage("");

    setEditingItemId(item.id);
    setEditForm({
      customName: item.custom_name || "",
      quantity: item.quantity || 1,
      sizeCode: item.size_code || "",
      category: item.category || "",
      audience: item.audience || "unisex",
      baseVolumeCm3: item.base_volume_cm3 || "",
      baseWeightG: item.base_weight_g || "",
      packBehavior: item.pack_behavior || "semi-rigid",
    });
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditForm({
      customName: "",
      quantity: 1,
      sizeCode: "",
      category: "",
      audience: "unisex",
      baseVolumeCm3: "",
      baseWeightG: "",
      packBehavior: "semi-rigid",
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async (item) => {
    try {
      setSavingEdit(true);
      setActionError("");
      setActionMessage("");

      const payload = {
        itemId: item.item_id || null,
        customName: item.source_type === "custom" ? editForm.customName : null,
        sourceType: item.source_type,
        quantity: Number(editForm.quantity) || 1,
        sizeCode: editForm.sizeCode || null,
        category: editForm.category || null,
        audience: editForm.audience || "unisex",
        baseVolumeCm3: Number(editForm.baseVolumeCm3),
        baseWeightG: Number(editForm.baseWeightG),
        packBehavior: editForm.packBehavior,
      };

      const response = await api.put(
        `/trips/${id}/items/${item.id}`,
        payload
      );

      setActionMessage(response.data.message || "Item updated successfully.");
      cancelEditingItem();
      await loadData();
    } catch (error) {
      console.error("Save item edit error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to update item."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleApplyTemplate = async (replaceExisting = false) => {
    if (!selectedTemplateId) {
      setActionError("Please choose a template first.");
      return;
    }
  
    if (tripItems.length > 0 && replaceExisting) {
      const confirmed = window.confirm(
        "This will remove the current trip items and replace them with the selected template. Continue?"
      );
  
      if (!confirmed) return;
    }
  
    try {
      setApplyingTemplate(true);
      setActionError("");
      setActionMessage("");
  
      const response = await api.post(
        `/packing-templates/apply/${selectedTemplateId}/trips/${id}`,
        {
          replaceExisting,
        }
      );
  
      setActionMessage(
        response.data.message || "Packing template applied successfully."
      );
  
      setSelectedTemplateId("");
      await loadData();
    } catch (error) {
      console.error("Apply template error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to apply packing template."
      );
    } finally {
      setApplyingTemplate(false);
    }
  };

  const handleClearAllItems = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove all items from this trip?"
    );
  
    if (!confirmed) return;
  
    try {
      setClearingItems(true);
      setActionError("");
      setActionMessage("");
  
      const response = await api.delete(`/trips/${id}/items`);
  
      setActionMessage(
        response.data.message || "Trip items cleared successfully."
      );
  
      setEditingItemId(null);
      await loadData();
    } catch (error) {
      console.error("Clear trip items error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to clear trip items."
      );
    } finally {
      setClearingItems(false);
    }
  };

  const handleAssignBag = async (tripItemId, assignedBagId) => {
    try {
      setAssigningBagItemId(tripItemId);
      setActionError("");
      setActionMessage("");
  
      const response = await api.put(
        `/trips/${id}/items/${tripItemId}/assign-bag`,
        {
          assignedBagId: assignedBagId || null,
        }
      );
  
      setActionMessage(
        response.data.message || "Trip item bag assignment updated successfully."
      );
  
      await loadData();
    } catch (error) {
      console.error("Assign bag error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to assign item to bag."
      );
    } finally {
      setAssigningBagItemId(null);
    }
  };

  if (loading) {
    return <div className="page-container">Loading trip items...</div>;
  }

  return (
    <div className="page-container">
      <div className="trip-form-hero card">
        <div className="trip-form-hero-top">
          <div>
            <div className="trip-form-kicker">Trips / Items</div>
            <h1 className="section-title">Trip Items</h1>
            <p className="page-subtitle">
              Add, edit, and manage the items linked to this trip.            
            </p>
          </div>

          <button className="secondary-btn" onClick={() => navigate(`/trips/${id}`)}>
            Back to Trip
          </button>
        </div>

        <div className="trip-form-hero-grid">
          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Current items</span>
            <strong className="trip-form-hero-value">{tripItems.length}</strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Available actions</span>
            <strong className="trip-form-hero-value">Add, edit and remove items</strong>
          </div>
        </div>
      </div>
      <div className="card trip-items-personalization-box">
        <h3 className="trip-items-card-title">Your Preferences</h3>
        <p className="info-text">
          Suggestions can use your saved size and travel style preferences.
        </p>

        <div className="trip-items-personalization-grid">
          <div className="trip-items-personalization-item">
            <span className="trip-items-personalization-label">Default Size</span>
            <strong>{profileInfo?.profile?.defaultSize || "Not set"}</strong>
          </div>

          <div className="trip-items-personalization-item">
            <span className="trip-items-personalization-label">Travel Style</span>
            <strong>{profileInfo?.profile?.travelStyle || "casual"}</strong>
          </div>

          <div className="trip-items-personalization-item">
            <span className="trip-items-personalization-label">Preferred Suitcase</span>
            <strong>{profileInfo?.profile?.preferredSuitcaseName || "Not set"}</strong>
          </div>
        </div>
      </div>

      {pageError && <div className="card trip-items-error">{pageError}</div>}
      {actionError && <div className="card trip-items-error">{actionError}</div>}
      {actionMessage && <div className="card trip-items-success">{actionMessage}</div>}

      <div className="card trip-items-template-box">
        <div className="trip-form-section-header">
          <h2 className="trip-items-card-title">Apply Packing Template</h2>
          <p className="info-text">
            Use one of your saved templates to quickly fill this trip with items.
          </p>
        </div>

        {packingTemplates.length === 0 ? (
          <p className="info-text">
            You do not have any packing templates yet.
          </p>
        ) : (
          <div className="trip-items-template-actions trip-items-template-actions-stack">
            <div className="control-group">
              <label>Packing Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="">Choose a template</option>
                {packingTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} — {template.travel_type} / {template.weather_type}
                  </option>
                ))}
              </select>
            </div>

            {tripItems.length === 0 ? (
              <button
                className="primary-btn"
                type="button"
                onClick={() => handleApplyTemplate(false)}
                disabled={applyingTemplate}
              >
                {applyingTemplate ? "Applying..." : "Apply Template"}
              </button>
            ) : (
              <div className="trip-items-template-warning-box">
                <p className="info-text">
                  This trip already has items. You can clear them or replace them with the selected template.
                </p>

                <div className="trip-items-template-button-row">
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={handleClearAllItems}
                    disabled={clearingItems}
                  >
                    {clearingItems ? "Clearing..." : "Clear All Items"}
                  </button>

                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => handleApplyTemplate(true)}
                    disabled={applyingTemplate}
                  >
                    {applyingTemplate ? "Replacing..." : "Replace with Template"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="trip-items-grid">
        <div className="card">
          <div className="trip-form-section-header">
            <h2 className="trip-items-card-title">Add Base Item</h2>
            <p className="info-text">Choose an item from the base library and add it to this trip.</p>
          </div>

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
          <div className="trip-form-section-header">
            <h2 className="trip-items-card-title">Add Custom Item</h2>
            <p className="info-text">Create a custom item with your own packing values and behavior.</p>
          </div>

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
              These items are currently linked to this trip.
            </p>
          </div>

          <div className="trip-items-list-header-actions">
            {tripItems.length > 0 && (
              <button
                className="trip-delete-btn"
                type="button"
                onClick={handleClearAllItems}
                disabled={clearingItems}
              >
                {clearingItems ? "Clearing..." : "Clear All Items"}
              </button>
            )}

            <button className="secondary-btn" onClick={() => navigate(`/trips/${id}`)}>
              Done
            </button>
          </div>
        </div>

        {tripItems.length === 0 ? (
          <div className="trip-empty-state">
            <p className="info-text">
             No items have been added to this trip yet. Add a base item or create a custom item to continue.
            </p>
          </div>
        ) : (
          <div className="trip-items-current-list">
            {tripItems.map((item) => (
              <div key={item.id} className="trip-item-row">
                <div className="trip-item-row-content">
                  <h3 className="trip-item-row-title">
                    {item.custom_name || item.base_item_name || `Item #${item.item_id || item.id}`}
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
                  <div className="trip-item-bag-assign-box">
                    <label className="trip-item-bag-assign-label">Bag Assignment</label>
                    <select
                      className="trip-item-bag-select"
                      value={item.assigned_bag_id || ""}
                      onChange={(e) => handleAssignBag(item.id, e.target.value)}
                      disabled={assigningBagItemId === item.id}
                    >
                      <option value="">Auto</option>
                      {tripSuitcases.map((bag) => (
                        <option key={bag.id} value={bag.id}>
                          {bag.name} — {bag.bag_role}
                          {bag.is_primary ? " (Primary)" : ""}
                        </option>
                      ))}
                    </select>

                    <p className="trip-item-row-meta">
                      <strong>Current:</strong>{" "}
                      {item.assigned_bag_name
                        ? `${item.assigned_bag_name} (${item.assigned_bag_role})`
                        : "Auto assignment"}
                    </p>
                  </div>
                </div>

                <div className="trip-item-row-actions">
                  <button
                    className="trip-item-edit-btn"
                    onClick={() => startEditingItem(item)}
                    disabled={editingItemId === item.id}
                  >
                    Edit
                  </button>

                  <button
                    className="trip-item-delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deletingItemId === item.id}
                  >
                    {deletingItemId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                {editingItemId === item.id && (
                  <div className="trip-item-edit-box">
                    <h4 className="trip-item-edit-title">Edit Item</h4>

                    <div className="trip-item-edit-grid">
                      {item.source_type === "custom" && (
                        <div className="control-group">
                          <label>Custom Name</label>
                          <input
                            type="text"
                            value={editForm.customName}
                            onChange={(e) =>
                              handleEditFormChange("customName", e.target.value)
                            }
                          />
                        </div>
                      )}

                      <div className="control-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.quantity}
                          onChange={(e) =>
                            handleEditFormChange("quantity", e.target.value)
                          }
                        />
                      </div>

                      <div className="control-group">
                        <label>Size Code</label>
                        <input
                          type="text"
                          value={editForm.sizeCode}
                          onChange={(e) =>
                            handleEditFormChange("sizeCode", e.target.value)
                          }
                          placeholder="e.g. M"
                        />
                      </div>

                      <div className="control-group">
                        <label>Category</label>
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) =>
                            handleEditFormChange("category", e.target.value)
                          }
                        />
                      </div>

                      <div className="control-group">
                        <label>Audience</label>
                        <select
                          value={editForm.audience}
                          onChange={(e) =>
                            handleEditFormChange("audience", e.target.value)
                          }
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
                          value={editForm.baseVolumeCm3}
                          onChange={(e) =>
                            handleEditFormChange("baseVolumeCm3", e.target.value)
                          }
                        />
                      </div>

                      <div className="control-group">
                        <label>Weight (g)</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.baseWeightG}
                          onChange={(e) =>
                            handleEditFormChange("baseWeightG", e.target.value)
                          }
                        />
                      </div>

                      <div className="control-group">
                        <label>Pack Behavior</label>
                        <select
                          value={editForm.packBehavior}
                          onChange={(e) =>
                            handleEditFormChange("packBehavior", e.target.value)
                          }
                        >
                          <option value="foldable">foldable</option>
                          <option value="compressible">compressible</option>
                          <option value="semi-rigid">semi-rigid</option>
                          <option value="rigid">rigid</option>
                        </select>
                      </div>
                    </div>

                    <div className="trip-item-edit-actions">
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={cancelEditingItem}
                      >
                        Cancel
                      </button>

                      <button
                        className="primary-btn"
                        type="button"
                        onClick={() => handleSaveEdit(item)}
                        disabled={savingEdit}
                      >
                        {savingEdit ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TripItemsPage;