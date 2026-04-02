import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/ProfilePage.css";

function ProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    defaultSize: "",
    travelStyle: "casual",
    packingMode: "balanced",
    preferredSuitcaseName: "",
    notes: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get("/users/profile");

        setForm({
          firstName: response.data.user?.firstName || "",
          lastName: response.data.user?.lastName || "",
          email: response.data.user?.email || "",
          gender: response.data.profile?.gender || "",
          defaultSize: response.data.profile?.defaultSize || "",
          travelStyle: response.data.profile?.travelStyle || "casual",
          packingMode: response.data.profile?.packingMode || "balanced",
          preferredSuitcaseName:
            response.data.profile?.preferredSuitcaseName || "",
          notes: response.data.profile?.notes || "",
        });
      } catch (error) {
        console.error("Load profile error:", error);
        setErrorMessage(
          error?.response?.data?.message || "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrorMessage("First name and last name are required.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.put("/users/profile", {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender || null,
        defaultSize: form.defaultSize || null,
        travelStyle: form.travelStyle || "casual",
        packingMode: form.packingMode || "balanced",
        preferredSuitcaseName: form.preferredSuitcaseName || null,
        notes: form.notes || null,
      });

      setSuccessMessage(response.data.message || "Profile updated successfully.");
    } catch (error) {
      console.error("Update profile error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading profile...</div>;
  }

  return (
    <div className="page-container">
      <div className="trip-form-hero card">
        <div className="trip-form-hero-top">
          <div>
            <div className="trip-form-kicker">Account / Profile</div>
            <h1 className="section-title">Profile</h1>
            <p className="page-subtitle">
              Manage your account details and travel preferences.
            </p>
          </div>

          <button className="secondary-btn" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>

        <div className="trip-form-hero-grid">
          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Default size</span>
            <strong className="trip-form-hero-value">
              {form.defaultSize || "Not set"}
            </strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Travel style</span>
            <strong className="trip-form-hero-value">
              {form.travelStyle || "casual"}
            </strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Packing mode</span>
            <strong className="trip-form-hero-value">
              {form.packingMode || "balanced"}
            </strong>
          </div>
        </div>
      </div>

      <div className="card profile-card">
        {errorMessage && <div className="profile-error">{errorMessage}</div>}
        {successMessage && <div className="profile-success">{successMessage}</div>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="trip-form-section">
            <div className="trip-form-section-header">
              <h2>Basic Information</h2>
              <p className="info-text">Update your main account details.</p>
            </div>

            <div className="profile-grid">
              <div className="control-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  required
                />
              </div>

              <div className="control-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  required
                />
              </div>

              <div className="control-group">
                <label>Email</label>
                <input type="email" value={form.email} disabled />
              </div>

              <div className="control-group">
                <label>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="">Not set</option>
                  <option value="male">male</option>
                  <option value="female">female</option>
                  <option value="other">other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="trip-form-section">
            <div className="trip-form-section-header">
              <h2>Preferences</h2>
              <p className="info-text">
                These settings will support future trip personalization.
              </p>
            </div>

            <div className="profile-grid">
              <div className="control-group">
                <label>Default Size</label>
                <select
                  value={form.defaultSize}
                  onChange={(e) => handleChange("defaultSize", e.target.value)}
                >
                  <option value="">Not set</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div className="control-group">
                <label>Travel Style</label>
                <select
                  value={form.travelStyle}
                  onChange={(e) => handleChange("travelStyle", e.target.value)}
                >
                  <option value="casual">casual</option>
                  <option value="business">business</option>
                  <option value="family">family</option>
                  <option value="adventure">adventure</option>
                  <option value="luxury">luxury</option>
                  <option value="minimal">minimal</option>
                </select>
              </div>

              <div className="control-group profile-grid-full">
                <label>Preferred Suitcase Name</label>
                <input
                  type="text"
                  value={form.preferredSuitcaseName}
                  onChange={(e) =>
                    handleChange("preferredSuitcaseName", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="trip-form-section">
            <div className="trip-form-section-header">
              <h2>Notes</h2>
              <p className="info-text">Optional personal notes or packing preferences.</p>
            </div>

            <div className="control-group">
              <label>Packing Mode</label>
              <select
                value={form.packingMode}
                onChange={(e) => handleChange("packingMode", e.target.value)}
              >
                <option value="light">light</option>
                <option value="balanced">balanced</option>
                <option value="prepared">prepared</option>
              </select>
            </div>

            <div className="control-group">
              <label>Notes</label>
              <textarea
                className="profile-textarea"
                rows="4"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;