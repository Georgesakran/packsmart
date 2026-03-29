import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripSuitcasePage.css";

function TripSuitcasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileInfo, setProfileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingSuitcase, setExistingSuitcase] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedSuitcases, setSavedSuitcases] = useState([]);
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
  });

  useEffect(() => {
    const loadSuitcase = async () => {
      try {
        const profileRes = await api.get("/users/profile");
        setProfileInfo(profileRes.data || null);

        const savedSuitcasesRes = await api.get("/saved-suitcases");
        setSavedSuitcases(savedSuitcasesRes.data || []);  
  
        try {
          const response = await api.get(`/trips/${id}/suitcase`);
          const data = response.data;
  
          setExistingSuitcase(data);
          setForm({
            suitcaseType: data.suitcase_type || "preset",
            name: data.name || "",
            volumeCm3: data.volume_cm3 || "",
            maxWeightKg: data.max_weight_kg || "",
            lengthCm: data.length_cm || "",
            widthCm: data.width_cm || "",
            heightCm: data.height_cm || "",
            isCustom: !!data.is_custom,
          });
        } catch (error) {
          if (error?.response?.status === 404) {
            const preferredName =
              profileRes.data?.profile?.preferredSuitcaseName || "";
  
            setExistingSuitcase(null);
            setForm((prev) => ({
              ...prev,
              name: preferredName || "",
            }));
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error("Load suitcase/profile error:", error);
        setErrorMessage(
          error?.response?.data?.message || "Failed to load suitcase."
        );
      } finally {
        setLoading(false);
      }
    };
  
    loadSuitcase();
  }, [id]);

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

  const estimatedVolume = useMemo(() => {
    const l = Number(form.lengthCm || 0);
    const w = Number(form.widthCm || 0);
    const h = Number(form.heightCm || 0);

    if (!l || !w || !h) return null;
    return l * w * h;
  }, [form.lengthCm, form.widthCm, form.heightCm]);


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
      };

      if (existingSuitcase) {
        const response = await api.put(`/trips/${id}/suitcase`, payload);
        setSuccessMessage(response.data.message || "Suitcase updated successfully.");
      } else {
        const response = await api.post(`/trips/${id}/suitcase`, payload);
        setSuccessMessage(response.data.message || "Suitcase created successfully.");
      }

      setTimeout(() => {
        navigate(`/trips/${id}`);
      }, 800);
    } catch (error) {
      console.error("Save suitcase error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to save suitcase."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading suitcase...</div>;
  }

  return (
    <div className="page-container">
      <div className="trip-form-hero card">
        <div className="trip-form-hero-top">
          <div>
            <div className="trip-form-kicker">Trips / Suitcase</div>
            <h1 className="section-title">
              {existingSuitcase ? "Edit Trip Suitcase" : "Add Trip Suitcase"}
            </h1>
            <p className="page-subtitle">
              Set the suitcase details used for this trip.
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
            <span className="trip-form-hero-label">Mode</span>
            <strong className="trip-form-hero-value">
              {form.suitcaseType === "custom" ? "Custom suitcase" : "Preset suitcase"}
            </strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Estimated volume from dimensions</span>
            <strong className="trip-form-hero-value">
              {estimatedVolume ? `${estimatedVolume} cm³` : "Not available yet"}
            </strong>
          </div>
        </div>
      </div>
      {profileInfo?.profile?.preferredSuitcaseName && (
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
              Choose one of your saved suitcase presets to fill this trip faster.
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
      <div className="card trip-suitcase-card">
        {errorMessage && (
          <div className="trip-suitcase-error">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="trip-suitcase-success">{successMessage}</div>
        )}

        <form className="trip-suitcase-form" onSubmit={handleSubmit}>
          <div className="trip-form-section">
            <div className="trip-form-section-header">
              <h2>Suitcase Setup</h2>
              <p className="info-text">Choose the suitcase type and set the main limits.</p>
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
                <label>Suitcase Name</label>
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
            </div>
          </div>

          <div className="trip-form-section">
            <div className="trip-form-section-header">
              <h2>Dimensions</h2>
              <p className="info-text">Optional, but useful for custom suitcase planning.</p>
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
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(`/trips/${id}`)}
            >
              Cancel
            </button>

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting
                ? existingSuitcase
                  ? "Saving..."
                  : "Creating..."
                : existingSuitcase
                ? "Save Changes"
                : "Create Suitcase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TripSuitcasePage;