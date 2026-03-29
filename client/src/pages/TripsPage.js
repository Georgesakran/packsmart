import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/TripsPage.css";

function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingTripId, setDeletingTripId] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await api.get("/trips");
        setTrips(response.data);
      } catch (error) {
        console.error("Fetch trips error:", error);
        setErrorMessage(
          error?.response?.data?.message || "Failed to load trips."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const getStatusClass = (status) => {
    if (status === "calculated") return "trip-status-pill trip-status-pill-good";
    if (status === "archived") return "trip-status-pill trip-status-pill-warn";
    return "trip-status-pill trip-status-pill-neutral";
  };

  const handleDeleteTrip = async (tripId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trip? This action cannot be undone."
    );
  
    if (!confirmed) return;
  
    try {
      setDeletingTripId(tripId);
  
      const response = await api.delete(`/trips/${tripId}`);
  
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  
      if (!response?.data?.message) {
        console.log("Trip deleted successfully.");
      }
    } catch (error) {
      console.error("Delete trip from list error:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to delete trip."
      );
    } finally {
      setDeletingTripId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="trips-page-header">
        <div>
          <div className="trips-kicker">Trips</div>
          <h1 className="section-title">My Trips</h1>
          <p className="page-subtitle">
            Open a saved trip or create a new one to continue planning.
          </p>
        </div>

        <button className="primary-btn trips-header-btn" onClick={() => navigate("/trips/new")}>
          Create Trip
        </button>
      </div>

      {loading ? (
        <div className="card">Loading trips...</div>
      ) : errorMessage ? (
        <div className="card trips-error-box">{errorMessage}</div>
      ) : trips.length === 0 ? (
        <div className="card trips-empty-card">
          <h3>You haven’t created any trips yet.</h3>
          <p className="info-text">
            Create your first trip to start building a packing plan.
          </p>
          <button className="primary-btn" onClick={() => navigate("/trips/new")}>
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => (
            <div key={trip.id} className="card trip-card">
              <div className="trip-card-top">
                <h3 className="trip-card-title">{trip.trip_name}</h3>
                <span className={getStatusClass(trip.status)}>{trip.status}</span>
              </div>

              <div className="trip-card-body">
                <p className="trip-card-meta">
                  <strong>Destination:</strong> {trip.destination || "Not set"}
                </p>
                <p className="trip-card-meta">
                  <strong>Duration:</strong>{" "}
                  {trip.duration_days ? `${trip.duration_days} days` : "Not set"}
                </p>
                <p className="trip-card-meta">
                  <strong>Travel Type:</strong> {trip.travel_type}
                </p>
                <p className="trip-card-meta">
                  <strong>Weather:</strong> {trip.weather_type}
                </p>
              </div>

              <div className="trip-card-actions trip-card-actions-row">
                <button
                  className="secondary-btn"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  Open Trip
                </button>

                <button
                  className="trip-delete-btn"
                  onClick={() => handleDeleteTrip(trip.id)}
                  disabled={deletingTripId === trip.id}
                >
                  {deletingTripId === trip.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TripsPage;