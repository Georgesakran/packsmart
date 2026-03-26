import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/CreateTripPage.css";

function CreateTripPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    tripName: "",
    destination: "",
    startDate: "",
    endDate: "",
    durationDays: "",
    travelType: "casual",
    weatherType: "mixed",
    travelerCount: 1,
    notes: "",
    status: "draft",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!form.tripName.trim()) {
      setErrorMessage("Trip name is required.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/trips", {
        tripName: form.tripName,
        destination: form.destination,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        durationDays: form.durationDays ? Number(form.durationDays) : null,
        travelType: form.travelType,
        weatherType: form.weatherType,
        travelerCount: Number(form.travelerCount) || 1,
        notes: form.notes,
        status: form.status,
      });

      const newTripId = response.data.tripId;
      navigate(`/trips/${newTripId}`);
    } catch (error) {
      console.error("Create trip error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to create trip."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="create-trip-header">
        <div>
          <h1 className="section-title">Create Trip</h1>
          <p className="page-subtitle">
            Start a new trip and prepare the base details for your packing plan.
          </p>
        </div>
      </div>

      <div className="card create-trip-card">
        {errorMessage && (
          <div className="create-trip-error">{errorMessage}</div>
        )}

        <form className="create-trip-form" onSubmit={handleSubmit}>
          <div className="create-trip-grid">
            <div className="control-group">
              <label>Trip Name</label>
              <input
                type="text"
                value={form.tripName}
                onChange={(e) => handleChange("tripName", e.target.value)}
                required
              />
            </div>

            <div className="control-group">
              <label>Destination</label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => handleChange("destination", e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Duration (days)</label>
              <input
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) => handleChange("durationDays", e.target.value)}
              />
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
          </div>

          <div className="control-group" style={{ marginTop: "16px" }}>
            <label>Notes</label>
            <textarea
              className="create-trip-textarea"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows="4"
            />
          </div>

          <div className="create-trip-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/trips")}
            >
              Cancel
            </button>

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Creating trip..." : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTripPage;