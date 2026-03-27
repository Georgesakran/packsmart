import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/EditTripPage.css";

function EditTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  useEffect(() => {
    const loadTrip = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get(`/trips/${id}`);
        const trip = response.data;

        setForm({
          tripName: trip.trip_name || "",
          destination: trip.destination || "",
          startDate: trip.start_date || "",
          endDate: trip.end_date || "",
          durationDays: trip.duration_days || "",
          travelType: trip.travel_type || "casual",
          weatherType: trip.weather_type || "mixed",
          travelerCount: trip.traveler_count || 1,
          notes: trip.notes || "",
          status: trip.status || "draft",
        });
      } catch (error) {
        console.error("Load edit trip error:", error);
        setErrorMessage(
          error?.response?.data?.message || "Failed to load trip."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [id]);

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

    if (!form.tripName.trim()) {
      setErrorMessage("Trip name is required.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.put(`/trips/${id}`, {
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

      setSuccessMessage(response.data.message || "Trip updated successfully.");

      setTimeout(() => {
        navigate(`/trips/${id}`);
      }, 700);
    } catch (error) {
      console.error("Update trip error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to update trip."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading trip...</div>;
  }

  return (
    <div className="page-container">
      <div className="trip-form-hero card">
        <div className="trip-form-hero-top">
          <div>
            <div className="trip-form-kicker">Trips / Edit</div>
            <h1 className="section-title">Edit Trip</h1>
            <p className="page-subtitle">
              Update the trip details before continuing with packing.
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
            <span className="trip-form-hero-label">Trip setup</span>
            <strong className="trip-form-hero-value">Update timing, traveler count and status.</strong>
          </div>

          <div className="trip-form-hero-box">
            <span className="trip-form-hero-label">Current status</span>
            <strong className="trip-form-hero-value">{form.status}</strong>
          </div>
        </div>
      </div>

      <div className="card edit-trip-card">
        {errorMessage && <div className="edit-trip-error">{errorMessage}</div>}
        {successMessage && (
          <div className="edit-trip-success">{successMessage}</div>
        )}

        <form className="edit-trip-form" onSubmit={handleSubmit}>
          <div className="trip-form-section">
            <div className="trip-form-section-header">
              <h2>Basic Details</h2>
              <p className="info-text">Review the main trip information.</p>
            </div>

            <div className="edit-trip-grid">
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
          </div>

          <div className="trip-form-section">
            <div className="trip-form-section-header">
              <h2>Timing & Status</h2>
              <p className="info-text">Update timing, traveler count, and trip state.</p>
            </div>

            <div className="edit-trip-grid">
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
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="draft">draft</option>
                  <option value="calculated">calculated</option>
                  <option value="archived">archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="trip-form-section">
            <div className="trip-form-section-header">
              <h2>Notes</h2>
              <p className="info-text">Optional notes for context, reminders, or planning decisions.</p>
            </div>

            <div className="control-group">
              <label>Notes</label>
              <textarea
                className="edit-trip-textarea"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows="4"
              />
            </div>
          </div>

          <div className="edit-trip-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(`/trips/${id}`)}
            >
              Cancel
            </button>

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTripPage;