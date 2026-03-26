import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/TripsPage.css";

function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  return (
    <div className="page-container">
      <div className="trips-page-header">
        <div>
          <h1 className="section-title">My Trips</h1>
          <p className="page-subtitle">
            View your saved trips and continue building your packing plans.
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
        <div className="card">
          <h3>No trips yet</h3>
          <p className="info-text">
            Start by creating your first trip and building a packing plan.
          </p>
          <button className="primary-btn" onClick={() => navigate("/trips/new")}>
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => (
            <div key={trip.id} className="card trip-card">
              <div>
                <h3 className="trip-card-title">{trip.trip_name}</h3>
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
                <p className="trip-card-meta">
                  <strong>Status:</strong> {trip.status}
                </p>
              </div>

              <div className="trip-card-actions">
                <button
                  className="secondary-btn"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  Open Trip
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