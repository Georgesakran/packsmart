import { useCallback, useEffect, useState , useMemo} from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/TripDetailsPage.css";

function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileInfo, setProfileInfo] = useState(null);
  const [trip, setTrip] = useState(null);
  const [suitcase, setSuitcase] = useState(null);
  const [tripItems, setTripItems] = useState([]);
  const [results, setResults] = useState(null);
  const [suggestionMeta, setSuggestionMeta] = useState(null);
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
      try {
        const profileRes = await api.get("/users/profile");
        setProfileInfo(profileRes.data);
      } catch {
        setProfileInfo(null);
      }
      const [tripRes, suitcaseRes, itemsRes, resultsRes] =
        await Promise.allSettled([
          api.get(`/trips/${id}`),
          api.get(`/trips/${id}/suitcase`),
          api.get(`/trips/${id}/items`),
          api.get(`/trips/${id}/results`),
        ]);
  
      // Trip (required)
      if (tripRes.status === "fulfilled") {
        setTrip(tripRes.value.data);
      } else {
        throw tripRes.reason;
      }
  
      // Optional data (safe fallback)
      setSuitcase(
        suitcaseRes.status === "fulfilled" ? suitcaseRes.value.data : null
      );
  
      setTripItems(
        itemsRes.status === "fulfilled" ? itemsRes.value.data || [] : []
      );
  
      setResults(
        resultsRes.status === "fulfilled" ? resultsRes.value.data : null
      );
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

      const generatedMessage =
        response.data?.profileUsed
          ? `Suggestions generated successfully using your size ${response.data.profileUsed.defaultSize} and travel style ${response.data.profileUsed.travelStyle}.`
          : response.data.message || "Suggestions generated successfully.";

      setActionMessage(generatedMessage);
      setSuggestionMeta({
        durationDays: response.data?.trip?.durationDays,
        travelType: response.data?.trip?.travelType,
        weatherType: response.data?.trip?.weatherType,
        travelerCount: response.data?.trip?.travelerCount,
        defaultSize: response.data?.profileUsed?.defaultSize,
        travelStyle: response.data?.profileUsed?.travelStyle,
      });
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

  const tripStatusLabel = useMemo(() => {
    if (!trip?.status) return "draft";
    return trip.status;
  }, [trip]);

  const suitcaseStatus = suitcase ? "Added" : "Missing";
  const itemsStatus = tripItems.length > 0 ? `${tripItems.length} items` : "No items";
  const resultsStatus = results ? "Calculated" : "Not calculated";

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
      <div className="trip-details-hero card">
        <div className="trip-details-hero-top">
          <div>
            <div className="trip-details-breadcrumb">Trips / Trip Details</div>
            <h1 className="section-title">{trip?.trip_name}</h1>
            <p className="page-subtitle">
              Manage this trip and continue building its packing plan.
            </p>
          </div>

          <div className={`trip-status-badge trip-status-${tripStatusLabel}`}>
            {tripStatusLabel}
          </div>
        </div>

        <div className="trip-hero-meta">
          <div className="trip-hero-meta-item">
            <span className="trip-hero-meta-label">Destination</span>
            <span className="trip-hero-meta-value">{trip?.destination || "Not set"}</span>
          </div>

          <div className="trip-hero-meta-item">
            <span className="trip-hero-meta-label">Duration</span>
            <span className="trip-hero-meta-value">
              {trip?.duration_days ? `${trip.duration_days} days` : "Not set"}
            </span>
          </div>

          <div className="trip-hero-meta-item">
            <span className="trip-hero-meta-label">Travel Type</span>
            <span className="trip-hero-meta-value">{trip?.travel_type}</span>
          </div>

          <div className="trip-hero-meta-item">
            <span className="trip-hero-meta-label">Weather</span>
            <span className="trip-hero-meta-value">{trip?.weather_type}</span>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="card trip-details-success">{actionMessage}</div>
      )}

      {actionError && (
        <div className="card trip-details-error">{actionError}</div>
      )}

{suggestionMeta && (
        <div className="card trip-suggestion-meta-box">
          <div className="trip-actions-header">
            <div>
              <h2 className="trip-details-card-title">Why these suggestions</h2>
              <p className="info-text">
                Suggestions were generated using your trip details and saved preferences.
              </p>
            </div>
          </div>

          <div className="trip-details-status-grid">
            <div className="card trip-status-card">
              <div className="trip-status-card-label">Duration</div>
              <div className="trip-status-card-value">
                {suggestionMeta.durationDays || "Not set"} days
              </div>
              <div className="trip-status-card-subtext">Trip length used in planning.</div>
            </div>

            <div className="card trip-status-card">
              <div className="trip-status-card-label">Travel Context</div>
              <div className="trip-status-card-value">
                {suggestionMeta.travelType || "casual"}
              </div>
              <div className="trip-status-card-subtext">
                Weather: {suggestionMeta.weatherType || "mixed"}
              </div>
            </div>

            <div className="card trip-status-card">
              <div className="trip-status-card-label">Your Preferences</div>
              <div className="trip-status-card-value">
                {suggestionMeta.defaultSize || "M"}
              </div>
              <div className="trip-status-card-subtext">
                Travel style: {suggestionMeta.travelStyle || "casual"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="trip-details-status-grid">
        <div className="card trip-status-card">
          <div className="trip-status-card-label">Suitcase</div>
          <div className="trip-status-card-value">{suitcaseStatus}</div>
          <div className="trip-status-card-subtext">
            {suitcase ? suitcase.name : "No suitcase assigned yet"}
          </div>
        </div>

        <div className="card trip-status-card">
          <div className="trip-status-card-label">Items</div>
          <div className="trip-status-card-value">{itemsStatus}</div>
          <div className="trip-status-card-subtext">
            {tripItems.length > 0
              ? "Trip items are ready to calculate"
              : "Add items or generate suggestions"}
          </div>
        </div>

        <div className="card trip-status-card">
          <div className="trip-status-card-label">Results</div>
          <div className="trip-status-card-value">{resultsStatus}</div>
          <div className="trip-status-card-subtext">
            {results
              ? "A saved result is available for this trip"
              : "No calculation has been saved yet"}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="trip-actions-header">
          <div>
            <h2 className="trip-details-card-title">Personalization</h2>
            <p className="info-text">
              Your saved preferences help shape suggestions and planning.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={() => navigate("/profile")}
          >
            Edit Profile
          </button>
        </div>

        <div className="trip-details-status-grid">
          <div className="card trip-status-card">
            <div className="trip-status-card-label">Default Size</div>
            <div className="trip-status-card-value">
              {profileInfo?.profile?.defaultSize || "Not set"}
            </div>
            <div className="trip-status-card-subtext">
              Used for suggested clothing sizes when available.
            </div>
          </div>

          <div className="card trip-status-card">
            <div className="trip-status-card-label">Travel Style</div>
            <div className="trip-status-card-value">
              {profileInfo?.profile?.travelStyle || "casual"}
            </div>
            <div className="trip-status-card-subtext">
              Suggestions adapt to your preferred travel style.
            </div>
          </div>

          <div className="card trip-status-card">
            <div className="trip-status-card-label">Preferred Suitcase</div>
            <div className="trip-status-card-value">
              {profileInfo?.profile?.preferredSuitcaseName || "Not set"}
            </div>
            <div className="trip-status-card-subtext">
              Saved as a personal planning preference.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="trip-actions-header">
          <div>
            <h2 className="trip-details-card-title">Quick Actions</h2>
            <p className="info-text">
              Use these actions to continue and update this trip.
            </p>
          </div>

          <button className="secondary-btn" onClick={() => navigate("/trips")}>
            Back to Trips
          </button>
        </div>

        <div className="trip-actions-grid">
          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/edit`)}
          >
            Edit Trip
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/suitcase`)}
          >
            {suitcase ? "Edit Suitcase" : "Add Suitcase"}
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/items`)}
          >
            Manage Items
          </button>

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

          <button
            className="secondary-btn"
            onClick={() => navigate(`/trips/${id}/results`)}
            disabled={!results}
          >
            Open Full Results
          </button>
        </div>
      </div>

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
            <p className="info-text">
              No suitcase has been added to this trip yet. Add a suitcase to continue.
              {profileInfo?.profile?.preferredSuitcaseName
                ? ` Your saved preference is ${profileInfo.profile.preferredSuitcaseName}.`
                : ""}
            </p>
          )}
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
          <div className="trip-empty-state">
            <p className="info-text">
              No items have been added to this trip yet. Add items or generate suggestions to continue.
            </p>
          </div>
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
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 className="trip-details-card-title">Latest Result</h2>

        {!results ? (
          <div className="trip-empty-state">
            <p className="info-text">
              No saved result is available yet. Add a suitcase and items, then calculate this trip.
            </p>
          </div>
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
      </div>
    </div>
  );
}

export default TripDetailsPage;