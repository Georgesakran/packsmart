import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripSuitcasePage.css";

function TripSuitcasePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tripSuitcases, setTripSuitcases] = useState([]);
  const [savedSuitcases, setSavedSuitcases] = useState([]);
  const [profileInfo, setProfileInfo] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedSavedSuitcaseId, setSelectedSavedSuitcaseId] = useState("");

  const [form, setForm] = useState({
    suitcaseType: "preset",
    name: "",
    volumeCm3: "",
    maxWeightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    isCustom: false,
    bagRole: "main",
    isPrimary: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
  
      const [profileRes, savedSuitcasesRes, tripSuitcasesRes] =
        await Promise.all([
          api.get("/users/profile"),
          api.get("/saved-suitcases"),
          api.get(`/trips/${id}/suitcases`),
        ]);
  
      setProfileInfo(profileRes.data || null);
      setSavedSuitcases(savedSuitcasesRes.data || []);
      setTripSuitcases(tripSuitcasesRes.data || []);
    } catch (error) {
      console.error("Load trip suitcases error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to load trip suitcases."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const estimatedVolume = useMemo(() => {
    const l = Number(form.lengthCm || 0);
    const w = Number(form.widthCm || 0);
    const h = Number(form.heightCm || 0);

    if (!l || !w || !h) return null;
    return l * w * h;
  }, [form.lengthCm, form.widthCm, form.heightCm]);

  const resetForm = () => {
    setForm({
      suitcaseType: "preset",
      name: profileInfo?.profile?.preferredSuitcaseName || "",
      volumeCm3: "",
      maxWeightKg: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      isCustom: false,
      bagRole: "main",
      isPrimary: tripSuitcases.length === 0,
    });
    setEditingId(null);
    setSelectedSavedSuitcaseId("");
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTypeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      suitcaseType: value,
      isCustom: value === "custom",
    }));
  };

  const handleSelectSavedSuitcase = (savedSuitcaseId) => {
    setSelectedSavedSuitcaseId(savedSuitcaseId);

    const selected = savedSuitcases.find(
      (item) => item.id === Number(savedSuitcaseId)
    );

    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      suitcaseType: "preset",
      name: selected.name || "",
      volumeCm3: selected.volume_cm3 || "",
      maxWeightKg: selected.max_weight_kg || "",
      lengthCm: selected.length_cm || "",
      widthCm: selected.width_cm || "",
      heightCm: selected.height_cm || "",
      isCustom: false,
    }));
  };

  const handleEdit = (bag) => {
    setEditingId(bag.id);
    setSelectedSavedSuitcaseId("");
    setErrorMessage("");
    setSuccessMessage("");

    setForm({
      suitcaseType: bag.suitcase_type || "preset",
      name: bag.name || "",
      volumeCm3: bag.volume_cm3 || "",
      maxWeightKg: bag.max_weight_kg || "",
      lengthCm: bag.length_cm || "",
      widthCm: bag.width_cm || "",
      heightCm: bag.height_cm || "",
      isCustom: !!bag.is_custom,
      bagRole: bag.bag_role || "main",
      isPrimary: !!bag.is_primary,
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
        suitcaseType: form.suitcaseType,
        name: form.name,
        volumeCm3: Number(form.volumeCm3),
        maxWeightKg: Number(form.maxWeightKg),
        lengthCm: form.lengthCm ? Number(form.lengthCm) : null,
        widthCm: form.widthCm ? Number(form.widthCm) : null,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
        isCustom: form.isCustom,
        bagRole: form.bagRole,
        isPrimary: !!form.isPrimary,
      };

      if (editingId) {
        const response = await api.put(
          `/trips/${id}/suitcases/${editingId}`,
          payload
        );
        setSuccessMessage(response.data.message || "Trip suitcase updated successfully.");
      } else {
        const response = await api.post(`/trips/${id}/suitcases`, payload);
        setSuccessMessage(response.data.message || "Trip suitcase created successfully.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("Save trip suitcase error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to save trip suitcase."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (suitcaseId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this suitcase from the trip?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(suitcaseId);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.delete(`/trips/${id}/suitcases/${suitcaseId}`);
      setSuccessMessage(response.data.message || "Trip suitcase deleted successfully.");

      if (editingId === suitcaseId) {
        resetForm();
      }

      await loadData();
    } catch (error) {
      console.error("Delete trip suitcase error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to delete trip suitcase."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="page-container">Loading suitcases...</div>;
  }

  return (
    <div className="page-container">
      <div className="trip-form-hero card">
        <div className="trip-form-hero-top">
          <div>
            <div className="trip-form-kicker">Trips / Suitcases</div>
            <h1 className="section-title">Manage Trip Suitcases</h1>
            <p className="page-subtitle">
              Add, edit, and organize all bags linked to this trip.
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
            <span className="trip-form-hero-label">Trip bags</span>
            <strong className="trip-form-hero-value">{tripSuitcases.length}</strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Estimated volume</span>
            <strong className="trip-form-hero-value">
              {estimatedVolume ? `${estimatedVolume} cm³` : "Not available yet"}
            </strong>
          </div>
        </div>
      </div>

      {profileInfo?.profile?.preferredSuitcaseName && !editingId && (
        <div className="card trip-suitcase-hint-box">
          <h3 className="trip-items-card-title">Saved Preference</h3>
          <p className="info-text">
            Your preferred suitcase is{" "}
            <strong>{profileInfo.profile.preferredSuitcaseName}</strong>.
          </p>
        </div>
      )}

      {savedSuitcases.length > 0 && (
        <div className="card trip-suitcase-hint-box">
          <div className="trip-form-section-header">
            <h2>Use a Saved Suitcase</h2>
            <p className="info-text">
              Choose one of your saved suitcase presets to fill this form faster.
            </p>
          </div>

          <div className="control-group">
            <label>Saved Suitcase Preset</label>
            <select
              value={selectedSavedSuitcaseId}
              onChange={(e) => handleSelectSavedSuitcase(e.target.value)}
            >
              <option value="">Choose a saved suitcase</option>
              {savedSuitcases.map((suitcase) => (
                <option key={suitcase.id} value={suitcase.id}>
                  {suitcase.name} — {suitcase.volume_cm3} cm³ / {suitcase.max_weight_kg} kg
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {errorMessage && <div className="card trip-suitcase-error">{errorMessage}</div>}
      {successMessage && <div className="card trip-suitcase-success">{successMessage}</div>}

      <div className="saved-suitcases-grid">
        <div className="card trip-suitcase-card">
          <div className="trip-form-section-header">
            <h2>{editingId ? "Edit Trip Suitcase" : "Add Trip Suitcase"}</h2>
            <p className="info-text">
              Create a bag for this trip and define its role and limits.
            </p>
          </div>

          <form className="trip-suitcase-form" onSubmit={handleSubmit}>
            <div className="trip-form-section">
              <div className="trip-form-section-header">
                <h2>Bag Setup</h2>
                <p className="info-text">Set the bag type, role, and core storage limits.</p>
              </div>

              <div className="trip-suitcase-grid">
                <div className="control-group">
                  <label>Suitcase Type</label>
                  <select
                    value={form.suitcaseType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    <option value="preset">preset</option>
                    <option value="custom">custom</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Bag Role</label>
                  <select
                    value={form.bagRole}
                    onChange={(e) => handleChange("bagRole", e.target.value)}
                  >
                    <option value="main">main</option>
                    <option value="carry_on">carry_on</option>
                    <option value="personal">personal</option>
                    <option value="extra">extra</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Suitcase Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="control-group checkbox-group">
                  <label>Primary Bag</label>
                  <input
                    type="checkbox"
                    checked={form.isPrimary}
                    onChange={(e) => handleChange("isPrimary", e.target.checked)}
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
              </div>
            </div>

            <div className="trip-form-section">
              <div className="trip-form-section-header">
                <h2>Dimensions</h2>
                <p className="info-text">Optional dimensions for more detailed bag setup.</p>
              </div>

              <div className="trip-suitcase-grid">
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

                <div className="control-group checkbox-group">
                  <label>Custom Suitcase</label>
                  <input
                    type="checkbox"
                    checked={form.isCustom}
                    onChange={(e) => handleChange("isCustom", e.target.checked)}
                  />
                </div>
              </div>
            </div>

            <div className="trip-suitcase-actions">
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
                  : "Add Suitcase"}
              </button>
            </div>
          </form>
        </div>

        <div className="card saved-suitcases-list-card">
          <div className="trip-form-section-header">
            <h2>Trip Suitcases</h2>
            <p className="info-text">
              All bags currently linked to this trip.
            </p>
          </div>

          {tripSuitcases.length === 0 ? (
            <div className="trip-empty-state">
              <p className="info-text">
                No suitcases have been added to this trip yet.
              </p>
            </div>
          ) : (
            <div className="saved-suitcases-list">
              {tripSuitcases.map((bag) => (
                <div key={bag.id} className="saved-suitcase-row">
                  <div>
                    <h3 className="saved-suitcase-title">{bag.name}</h3>
                    <p className="saved-suitcase-meta">
                      <strong>Role:</strong> {bag.bag_role}
                    </p>
                    <p className="saved-suitcase-meta">
                      <strong>Primary:</strong> {bag.is_primary ? "Yes" : "No"}
                    </p>
                    <p className="saved-suitcase-meta">
                      <strong>Volume:</strong> {bag.volume_cm3} cm³
                    </p>
                    <p className="saved-suitcase-meta">
                      <strong>Max Weight:</strong> {bag.max_weight_kg} kg
                    </p>
                    <p className="saved-suitcase-meta">
                      <strong>Dimensions:</strong>{" "}
                      {bag.length_cm && bag.width_cm && bag.height_cm
                        ? `${bag.length_cm} × ${bag.width_cm} × ${bag.height_cm} cm`
                        : "Not set"}
                    </p>
                  </div>

                  <div className="saved-suitcase-row-actions">
                    <button
                      className="trip-item-edit-btn"
                      onClick={() => handleEdit(bag)}
                    >
                      Edit
                    </button>

                    <button
                      className="trip-delete-btn"
                      onClick={() => handleDelete(bag.id)}
                      disabled={deletingId === bag.id}
                    >
                      {deletingId === bag.id ? "Deleting..." : "Delete"}
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

export default TripSuitcasePage;