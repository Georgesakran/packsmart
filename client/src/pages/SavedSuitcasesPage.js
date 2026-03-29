import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/SavedSuitcasesPage.css";

function SavedSuitcasesPage() {
  const navigate = useNavigate();

  const [savedSuitcases, setSavedSuitcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    volumeCm3: "",
    maxWeightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
  });

  const loadSavedSuitcases = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/saved-suitcases");
      setSavedSuitcases(response.data || []);
    } catch (error) {
      console.error("Load saved suitcases error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to load saved suitcases."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedSuitcases();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      volumeCm3: "",
      maxWeightKg: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
    });
    setEditingId(null);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = (suitcase) => {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingId(suitcase.id);

    setForm({
      name: suitcase.name || "",
      volumeCm3: suitcase.volume_cm3 || "",
      maxWeightKg: suitcase.max_weight_kg || "",
      lengthCm: suitcase.length_cm || "",
      widthCm: suitcase.width_cm || "",
      heightCm: suitcase.height_cm || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Suitcase name is required.");
      return;
    }

    if (!form.volumeCm3 || !form.maxWeightKg) {
      setErrorMessage("Volume and max weight are required.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: form.name,
        volumeCm3: Number(form.volumeCm3),
        maxWeightKg: Number(form.maxWeightKg),
        lengthCm: form.lengthCm ? Number(form.lengthCm) : null,
        widthCm: form.widthCm ? Number(form.widthCm) : null,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
      };

      if (editingId) {
        const response = await api.put(`/saved-suitcases/${editingId}`, payload);
        setSuccessMessage(
          response.data.message || "Saved suitcase updated successfully."
        );
      } else {
        const response = await api.post("/saved-suitcases", payload);
        setSuccessMessage(
          response.data.message || "Saved suitcase created successfully."
        );
      }

      resetForm();
      await loadSavedSuitcases();
    } catch (error) {
      console.error("Save saved suitcase error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to save saved suitcase."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved suitcase?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.delete(`/saved-suitcases/${id}`);
      setSuccessMessage(
        response.data.message || "Saved suitcase deleted successfully."
      );

      if (editingId === id) {
        resetForm();
      }

      await loadSavedSuitcases();
    } catch (error) {
      console.error("Delete saved suitcase error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to delete saved suitcase."
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
            <div className="trip-form-kicker">Suitcases / Saved Presets</div>
            <h1 className="section-title">Saved Suitcases</h1>
            <p className="page-subtitle">
              Save reusable suitcase presets for faster trip setup.
            </p>
          </div>

          <button className="secondary-btn" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>

        <div className="trip-form-hero-grid">
          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Saved presets</span>
            <strong className="trip-form-hero-value">{savedSuitcases.length}</strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Use case</span>
            <strong className="trip-form-hero-value">Reuse suitcase setup faster</strong>
          </div>
        </div>
      </div>

      {errorMessage && <div className="card saved-suitcases-error">{errorMessage}</div>}
      {successMessage && <div className="card saved-suitcases-success">{successMessage}</div>}

      <div className="saved-suitcases-grid">
        <div className="card saved-suitcases-form-card">
          <div className="trip-form-section-header">
            <h2>{editingId ? "Edit Saved Suitcase" : "Add Saved Suitcase"}</h2>
            <p className="info-text">
              Save your most-used suitcase settings for future trips.
            </p>
          </div>

          <form className="saved-suitcases-form" onSubmit={handleSubmit}>
            <div className="saved-suitcases-form-grid">
              <div className="control-group">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="control-group">
                <label>Volume (cm³)</label>
                <input
                  type="number"
                  min="1"
                  value={form.volumeCm3}
                  onChange={(e) => handleChange("volumeCm3", e.target.value)}
                  required
                />
              </div>

              <div className="control-group">
                <label>Max Weight (kg)</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={form.maxWeightKg}
                  onChange={(e) => handleChange("maxWeightKg", e.target.value)}
                  required
                />
              </div>

              <div className="control-group">
                <label>Length (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={form.lengthCm}
                  onChange={(e) => handleChange("lengthCm", e.target.value)}
                />
              </div>

              <div className="control-group">
                <label>Width (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={form.widthCm}
                  onChange={(e) => handleChange("widthCm", e.target.value)}
                />
              </div>

              <div className="control-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={form.heightCm}
                  onChange={(e) => handleChange("heightCm", e.target.value)}
                />
              </div>
            </div>

            <div className="saved-suitcases-actions">
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
                  : "Save Suitcase"}
              </button>
            </div>
          </form>
        </div>

        <div className="card saved-suitcases-list-card">
          <div className="trip-form-section-header">
            <h2>Your Saved Suitcases</h2>
            <p className="info-text">
              Reusable presets you can use later in trip setup.
            </p>
          </div>

          {loading ? (
            <p className="info-text">Loading saved suitcases...</p>
          ) : savedSuitcases.length === 0 ? (
            <div className="trip-empty-state">
              <p className="info-text">
                You have not saved any suitcase presets yet.
              </p>
            </div>
          ) : (
            <div className="saved-suitcases-list">
              {savedSuitcases.map((suitcase) => (
                <div key={suitcase.id} className="saved-suitcase-row">
                  <div>
                    <h3 className="saved-suitcase-title">{suitcase.name}</h3>
                    <p className="saved-suitcase-meta">
                      <strong>Volume:</strong> {suitcase.volume_cm3} cm³
                    </p>
                    <p className="saved-suitcase-meta">
                      <strong>Max Weight:</strong> {suitcase.max_weight_kg} kg
                    </p>
                    <p className="saved-suitcase-meta">
                      <strong>Dimensions:</strong>{" "}
                      {suitcase.length_cm && suitcase.width_cm && suitcase.height_cm
                        ? `${suitcase.length_cm} × ${suitcase.width_cm} × ${suitcase.height_cm} cm`
                        : "Not set"}
                    </p>
                  </div>

                  <div className="saved-suitcase-row-actions">
                    <button
                      className="trip-item-edit-btn"
                      onClick={() => handleEdit(suitcase)}
                    >
                      Edit
                    </button>

                    <button
                      className="trip-delete-btn"
                      onClick={() => handleDelete(suitcase.id)}
                      disabled={deletingId === suitcase.id}
                    >
                      {deletingId === suitcase.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedSuitcasesPage;