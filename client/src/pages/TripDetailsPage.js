import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripDetailsPage.css";

function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [suitcase, setSuitcase] = useState(null);
  const [tripItems, setTripItems] = useState([]);
  const [results, setResults] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const loadTripData = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
  
      const tripRes = await api.get(`/trips/${id}`);
      setTrip(tripRes.data);
  
      try {
        const suitcaseRes = await api.get(`/trips/${id}/suitcase`);
        setSuitcase(suitcaseRes.data);
      } catch {
        setSuitcase(null);
      }
  
      try {
        const itemsRes = await api.get(`/trips/${id}/items`);
        setTripItems(itemsRes.data || []);
      } catch {
        setTripItems([]);
      }
  
      try {
        const resultsRes = await api.get(`/trips/${id}/results`);
        setResults(resultsRes.data);
      } catch {
        setResults(null);
      }
    } catch (error) {
      console.error("Load trip details error:", error);
      setPageError(
        error?.response?.data?.message || "Failed to load trip details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  const handleGenerateSuggestions = async () => {
    try {
      setGenerating(true);
      setActionError("");
      setActionMessage("");

      const response = await api.post(`/trips/${id}/generate-suggestions`, {});
      setActionMessage(response.data.message || "Suggestions generated successfully.");

      await loadTripData();
    } catch (error) {
      console.error("Generate suggestions error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to generate suggestions."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCalculateTrip = async () => {
    try {
      setCalculating(true);
      setActionError("");
      setActionMessage("");

      const response = await api.post(`/trips/${id}/calculate`, {});
      setResults(response.data);
      setActionMessage(response.data.message || "Trip calculated successfully.");
    } catch (error) {
      console.error("Calculate trip error:", error);
      setActionError(
        error?.response?.data?.message || "Failed to calculate trip."
      );
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading trip details...</div>;
  }

  if (pageError) {
    return (
      <div className="page-container">
        <div className="card trip-details-error">{pageError}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="trip-details-header">
        <div>
          <h1 className="section-title">{trip?.trip_name}</h1>
          <p className="page-subtitle">
            Manage this trip, review its packing setup, and calculate the result.
          </p>
        </div>

        <button className="secondary-btn" onClick={() => navigate("/trips")}>
          Back to Trips
        </button>
      </div>

      {actionMessage && (
        <div className="card trip-details-success">{actionMessage}</div>
      )}

      {actionError && (
        <div className="card trip-details-error">{actionError}</div>
      )}

      <div className="trip-details-grid">
        <div className="card trip-details-card">
          <h2 className="trip-details-card-title">Trip Information</h2>
          <p><strong>Destination:</strong> {trip?.destination || "Not set"}</p>
          <p><strong>Start Date:</strong> {trip?.start_date || "Not set"}</p>
          <p><strong>End Date:</strong> {trip?.end_date || "Not set"}</p>
          <p><strong>Duration:</strong> {trip?.duration_days || "Not set"} {trip?.duration_days ? "days" : ""}</p>
          <p><strong>Travel Type:</strong> {trip?.travel_type}</p>
          <p><strong>Weather:</strong> {trip?.weather_type}</p>
          <p><strong>Traveler Count:</strong> {trip?.traveler_count}</p>
          <p><strong>Status:</strong> {trip?.status}</p>
          <p><strong>Notes:</strong> {trip?.notes || "No notes"}</p>
        </div>

        <div className="card trip-details-card">
          <h2 className="trip-details-card-title">Suitcase</h2>
          {suitcase ? (
            <>
              <p><strong>Name:</strong> {suitcase.name}</p>
              <p><strong>Type:</strong> {suitcase.suitcase_type}</p>
              <p><strong>Volume:</strong> {suitcase.volume_cm3} cm³</p>
              <p><strong>Max Weight:</strong> {suitcase.max_weight_kg} kg</p>
              <p>
                <strong>Dimensions:</strong>{" "}
                {suitcase.length_cm && suitcase.width_cm && suitcase.height_cm
                  ? `${suitcase.length_cm} × ${suitcase.width_cm} × ${suitcase.height_cm} cm`
                  : "Not set"}
              </p>
            </>
          ) : (
            <p className="info-text">No suitcase assigned yet.</p>
          )}

          <div className="trip-details-card-actions">
            <button
              className="secondary-btn"
              onClick={() => navigate(`/trips/${id}/suitcase`)}
            >
              {suitcase ? "Edit Suitcase" : "Add Suitcase"}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="trip-items-header">
          <div>
            <h2 className="trip-details-card-title">Trip Items</h2>
            <p className="info-text">
              Review the current item list linked to this trip.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/items`)}
          >
            Manage Items
          </button>
        </div>

        {tripItems.length === 0 ? (
          <p className="info-text">No items added yet.</p>
        ) : (
          <div className="trip-items-list">
            {tripItems.map((item) => (
              <div key={item.id} className="trip-item-chip">
                {(item.custom_name || `Item #${item.item_id || item.id}`)} × {item.quantity}
                {item.size_code ? ` (${item.size_code})` : ""}
              </div>
            ))}
          </div>
        )}

        <div className="trip-details-actions-row">
          <button
            className="secondary-btn"
            onClick={handleGenerateSuggestions}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Suggestions"}
          </button>

          <button
            className="primary-btn"
            onClick={handleCalculateTrip}
            disabled={calculating}
          >
            {calculating ? "Calculating..." : "Calculate Trip"}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="trip-details-card-title">Latest Result</h2>

        {!results ? (
          <p className="info-text">No calculation result yet.</p>
        ) : (
          <div className="trip-result-summary-grid">
            <div className="trip-result-stat">
              <div className="trip-result-stat-label">Total Volume</div>
              <div className="trip-result-stat-value">
                {results.totals?.totalVolumeCm3} cm³
              </div>
            </div>

            <div className="trip-result-stat">
              <div className="trip-result-stat-label">Total Weight</div>
              <div className="trip-result-stat-value">
                {results.totals?.weightKg} kg
              </div>
            </div>

            <div className="trip-result-stat">
              <div className="trip-result-stat-label">Used Capacity</div>
              <div className="trip-result-stat-value">
                {results.totals?.usedCapacityPercent}%
              </div>
            </div>

            <div className="trip-result-stat">
              <div className="trip-result-stat-label">Remaining Volume</div>
              <div className="trip-result-stat-value">
                {results.totals?.remainingVolumeCm3} cm³
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="trip-details-actions-row" style={{ marginTop: "18px" }}>
            <button
              className="secondary-btn"
              onClick={() => navigate(`/trips/${id}/results`)}
            >
              Open Full Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripDetailsPage;