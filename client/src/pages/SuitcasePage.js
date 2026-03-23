import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import SuitcaseCard from "../components/SuitcaseCard";
import Loading from "../components/Loading";
import "../styles/SuitcasePage.css";

function SuitcasePage() {
  const [suitcases, setSuitcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [customForm, setCustomForm] = useState({
    name: "Custom Suitcase",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    maxWeightKg: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuitcases = async () => {
      try {
        const response = await api.get("/suitcases");
        setSuitcases(response.data);
      } catch (error) {
        console.error("Error fetching suitcases:", error);
        setErrorMessage("Failed to load suitcase options.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuitcases();
  }, []);

  const handleSelect = (suitcase) => {
    localStorage.setItem("selectedSuitcase", JSON.stringify(suitcase));
    navigate("/items");
  };

  const handleCustomChange = (field, value) => {
    setCustomForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomSuitcase = () => {
    setErrorMessage("");

    const lengthCm = Number(customForm.lengthCm);
    const widthCm = Number(customForm.widthCm);
    const heightCm = Number(customForm.heightCm);
    const maxWeightKg = Number(customForm.maxWeightKg);

    if (
      lengthCm <= 0 ||
      widthCm <= 0 ||
      heightCm <= 0 ||
      maxWeightKg <= 0
    ) {
      setErrorMessage("Please enter valid custom suitcase dimensions and max weight.");
      return;
    }

    const customSuitcase = {
      id: "custom-suitcase",
      name: customForm.name || "Custom Suitcase",
      volume_cm3: lengthCm * widthCm * heightCm,
      max_weight_kg: maxWeightKg,
      length_cm: lengthCm,
      width_cm: widthCm,
      height_cm: heightCm,
      isCustom: true,
    };

    localStorage.setItem("selectedSuitcase", JSON.stringify(customSuitcase));
    navigate("/items");
  };

  return (
    <div className="page-container">
      <h1 className="section-title">Choose Your Suitcase</h1>
      <p className="page-subtitle">
        Choose a preset suitcase or create one with your own dimensions.
      </p>

      {errorMessage && (
        <div className="card" style={{ marginBottom: "16px", color: "crimson" }}>
          {errorMessage}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="suitcase-grid">
            {suitcases.map((suitcase) => (
              <SuitcaseCard
                key={suitcase.id}
                suitcase={suitcase}
                onSelect={handleSelect}
              />
            ))}
          </div>

          <div className="card custom-suitcase-box" style={{ marginTop: "24px" }}>
            <h2 className="section-title">Or Create a Custom Suitcase</h2>

            <div className="custom-suitcase-grid">
              <div className="control-group">
                <label>Name</label>
                <input
                  type="text"
                  value={customForm.name}
                  onChange={(e) => handleCustomChange("name", e.target.value)}
                />
              </div>

              <div className="control-group">
                <label>Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={customForm.lengthCm}
                  onChange={(e) => handleCustomChange("lengthCm", e.target.value)}
                />
              </div>

              <div className="control-group">
                <label>Width (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={customForm.widthCm}
                  onChange={(e) => handleCustomChange("widthCm", e.target.value)}
                />
              </div>

              <div className="control-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={customForm.heightCm}
                  onChange={(e) => handleCustomChange("heightCm", e.target.value)}
                />
              </div>

              <div className="control-group">
                <label>Max Weight (kg)</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={customForm.maxWeightKg}
                  onChange={(e) => handleCustomChange("maxWeightKg", e.target.value)}
                />
              </div>
            </div>

            {customForm.lengthCm && customForm.widthCm && customForm.heightCm ? (
              <p className="custom-suitcase-preview">
                Estimated Volume:{" "}
                <strong>
                  {Number(customForm.lengthCm || 0) *
                    Number(customForm.widthCm || 0) *
                    Number(customForm.heightCm || 0)}{" "}
                  cm³
                </strong>
              </p>
            ) : null}

            <button className="primary-btn" onClick={handleCustomSuitcase}>
              Use Custom Suitcase
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SuitcasePage;