import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/PackingTemplatesPage.css";

function PackingTemplatesPage() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [baseItems, setBaseItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    travelType: "casual",
    weatherType: "mixed",
    travelerCount: 1,
    notes: "",
    items: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [templatesRes, baseItemsRes] = await Promise.all([
        api.get("/packing-templates"),
        api.get("/items"),
      ]);

      setTemplates(templatesRes.data || []);
      setBaseItems(baseItemsRes.data || []);
    } catch (error) {
      console.error("Load packing templates error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to load packing templates."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      travelType: "casual",
      weatherType: "mixed",
      travelerCount: 1,
      notes: "",
      items: [],
    });
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddBaseItemToTemplate = (item) => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemId: item.id,
          customName: null,
          sourceType: "database",
          quantity: 1,
          sizeCode: item.size_mode === "alpha" ? "M" : null,
          category: item.category,
          audience: item.audience,
          baseVolumeCm3: item.base_volume_cm3,
          baseWeightG: item.base_weight_g,
          packBehavior: item.pack_behavior,
          displayName: item.name,
        },
      ],
    }));
  };

  const handleRemoveTemplateItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleTemplateItemChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleEdit = async (templateId) => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.get(`/packing-templates/${templateId}`);
      const { template, items } = response.data;

      setEditingId(template.id);
      setForm({
        name: template.name || "",
        travelType: template.travel_type || "casual",
        weatherType: template.weather_type || "mixed",
        travelerCount: template.traveler_count || 1,
        notes: template.notes || "",
        items: (items || []).map((item) => ({
          itemId: item.item_id || null,
          customName: item.custom_name || null,
          sourceType: item.source_type,
          quantity: item.quantity || 1,
          sizeCode: item.size_code || null,
          category: item.category || null,
          audience: item.audience || "unisex",
          baseVolumeCm3: item.base_volume_cm3,
          baseWeightG: item.base_weight_g,
          packBehavior: item.pack_behavior,
          displayName:
            item.custom_name || item.base_item_name || `Item #${item.item_id || item.id}`,
        })),
      });
    } catch (error) {
      console.error("Load template for edit error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to load template."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Template name is required.");
      return;
    }

    if (form.items.length === 0) {
      setErrorMessage("Add at least one item to the template.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: form.name,
        travelType: form.travelType,
        weatherType: form.weatherType,
        travelerCount: Number(form.travelerCount) || 1,
        notes: form.notes,
        items: form.items.map((item) => ({
          itemId: item.itemId || null,
          customName: item.customName || null,
          sourceType: item.sourceType,
          quantity: Number(item.quantity) || 1,
          sizeCode: item.sizeCode || null,
          category: item.category || null,
          audience: item.audience || "unisex",
          baseVolumeCm3: Number(item.baseVolumeCm3),
          baseWeightG: Number(item.baseWeightG),
          packBehavior: item.packBehavior,
        })),
      };

      if (editingId) {
        const response = await api.put(`/packing-templates/${editingId}`, payload);
        setSuccessMessage(
          response.data.message || "Packing template updated successfully."
        );
      } else {
        const response = await api.post("/packing-templates", payload);
        setSuccessMessage(
          response.data.message || "Packing template created successfully."
        );
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("Save packing template error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to save packing template."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (templateId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this packing template?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(templateId);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.delete(`/packing-templates/${templateId}`);
      setSuccessMessage(
        response.data.message || "Packing template deleted successfully."
      );

      if (editingId === templateId) {
        resetForm();
      }

      await loadData();
    } catch (error) {
      console.error("Delete packing template error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to delete packing template."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="trip-form-hero card">
        <div className="trip-form-hero-top">
          <div>
            <div className="trip-form-kicker">Templates / Packing</div>
            <h1 className="section-title">Packing Templates</h1>
            <p className="page-subtitle">
              Save reusable packing plans for faster trip setup.
            </p>
          </div>

          <button className="secondary-btn" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>

        <div className="trip-form-hero-grid">
          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Saved templates</span>
            <strong className="trip-form-hero-value">{templates.length}</strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Use case</span>
            <strong className="trip-form-hero-value">Reuse common trip packing setups</strong>
          </div>
        </div>
      </div>

      {errorMessage && <div className="card packing-templates-error">{errorMessage}</div>}
      {successMessage && <div className="card packing-templates-success">{successMessage}</div>}

      <div className="packing-templates-grid">
        <div className="card packing-templates-form-card">
          <div className="trip-form-section-header">
            <h2>{editingId ? "Edit Packing Template" : "Create Packing Template"}</h2>
            <p className="info-text">
              Build a reusable packing template with trip context and item set.
            </p>
          </div>

          <form className="packing-templates-form" onSubmit={handleSubmit}>
            <div className="packing-templates-form-grid">
              <div className="control-group">
                <label>Template Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="control-group">
                <label>Travel Type</label>
                <select
                  value={form.travelType}
                  onChange={(e) => handleChange("travelType", e.target.value)}
                >
                  <option value="weekend">weekend</option>
                  <option value="casual">casual</option>
                  <option value="business">business</option>
                  <option value="beach">beach</option>
                  <option value="winter">winter</option>
                  <option value="family">family</option>
                  <option value="adventure">adventure</option>
                </select>
              </div>

              <div className="control-group">
                <label>Weather Type</label>
                <select
                  value={form.weatherType}
                  onChange={(e) => handleChange("weatherType", e.target.value)}
                >
                  <option value="hot">hot</option>
                  <option value="mild">mild</option>
                  <option value="cold">cold</option>
                  <option value="mixed">mixed</option>
                </select>
              </div>

              <div className="control-group">
                <label>Traveler Count</label>
                <input
                  type="number"
                  min="1"
                  value={form.travelerCount}
                  onChange={(e) => handleChange("travelerCount", e.target.value)}
                />
              </div>
            </div>

            <div className="control-group">
              <label>Notes</label>
              <textarea
                className="packing-templates-textarea"
                rows="3"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            <div className="trip-form-section">
              <div className="trip-form-section-header">
                <h2>Template Items</h2>
                <p className="info-text">
                  Add base items to this reusable template.
                </p>
              </div>

              <div className="packing-templates-base-items">
                {baseItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="packing-template-add-chip"
                    onClick={() => handleAddBaseItemToTemplate(item)}
                  >
                    + {item.name}
                  </button>
                ))}
              </div>

              {form.items.length === 0 ? (
                <p className="info-text packing-template-empty-text">
                  No items have been added to this template yet.
                </p>
              ) : (
                <div className="packing-template-items-list">
                  {form.items.map((item, index) => (
                    <div key={`${item.displayName}-${index}`} className="packing-template-item-row">
                      <div className="packing-template-item-top">
                        <h4>{item.displayName}</h4>
                        <button
                          type="button"
                          className="trip-delete-btn"
                          onClick={() => handleRemoveTemplateItem(index)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="packing-template-item-grid">
                        <div className="control-group">
                          <label>Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleTemplateItemChange(index, "quantity", e.target.value)
                            }
                          />
                        </div>

                        <div className="control-group">
                          <label>Size Code</label>
                          <input
                            type="text"
                            value={item.sizeCode || ""}
                            onChange={(e) =>
                              handleTemplateItemChange(index, "sizeCode", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="packing-templates-actions">
              {editingId ? (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              ) : (
                <div />
              )}

              <button className="primary-btn" type="submit" disabled={submitting}>
                {submitting
                  ? editingId
                    ? "Saving..."
                    : "Creating..."
                  : editingId
                  ? "Save Changes"
                  : "Create Template"}
              </button>
            </div>
          </form>
        </div>

        <div className="card packing-templates-list-card">
          <div className="trip-form-section-header">
            <h2>Your Templates</h2>
            <p className="info-text">
              Reusable packing setups you can apply later to trips.
            </p>
          </div>

          {loading ? (
            <p className="info-text">Loading templates...</p>
          ) : templates.length === 0 ? (
            <div className="trip-empty-state">
              <p className="info-text">
                You have not created any packing templates yet.
              </p>
            </div>
          ) : (
            <div className="packing-templates-list">
              {templates.map((template) => (
                <div key={template.id} className="packing-template-card">
                  <div className="packing-template-card-top">
                    <div>
                      <h3 className="packing-template-card-title">{template.name}</h3>
                      <p className="packing-template-card-meta">
                        <strong>Travel Type:</strong> {template.travel_type}
                      </p>
                      <p className="packing-template-card-meta">
                        <strong>Weather:</strong> {template.weather_type}
                      </p>
                      <p className="packing-template-card-meta">
                        <strong>Travelers:</strong> {template.traveler_count}
                      </p>
                    </div>

                    <div className="saved-suitcase-row-actions">
                      <button
                        className="trip-item-edit-btn"
                        onClick={() => handleEdit(template.id)}
                      >
                        Edit
                      </button>

                      <button
                        className="trip-delete-btn"
                        onClick={() => handleDelete(template.id)}
                        disabled={deletingId === template.id}
                      >
                        {deletingId === template.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  <p className="packing-template-card-notes">
                    {template.notes || "No notes"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PackingTemplatesPage;