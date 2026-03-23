import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Loading from "../components/Loading";
import "../styles/ItemsPage.css";
import tripPresets from "../data/tripPresets";

function ItemsPage() {
  const navigate = useNavigate();
  const selectedSuitcase = JSON.parse(localStorage.getItem("selectedSuitcase"));

  const [items, setItems] = useState([]);
  const [sizeMultipliers, setSizeMultipliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [customForm, setCustomForm] = useState({
    name: "",
    quantity: 1,
    baseVolumeCm3: "",
    baseWeightG: "",
    packBehavior: "semi-rigid",
  });

  useEffect(() => {
    if (!selectedSuitcase) {
      navigate("/suitcases");
      return;
    }

    const fetchData = async () => {
      try {
        const [itemsRes, sizesRes] = await Promise.all([
          api.get("/items"),
          api.get("/size-multipliers"),
        ]);

        setItems(itemsRes.data);
        setSizeMultipliers(sizesRes.data);
      } catch (error) {
        console.error("Error loading items page data:", error);
        setErrorMessage("Failed to load items. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, selectedSuitcase]);

  const categories = useMemo(() => {
    return ["all", ...new Set(items.map((item) => item.category))];
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
  
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.category === categoryFilter);
    }
  
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(lowerSearch)
      );
    }
  
    return result;
  }, [items, categoryFilter, searchTerm]);

  const selectedSummary = useMemo(() => {
    const dbSummary = Object.entries(selectedItems)
      .map(([itemId, itemData]) => {
        const item = items.find((i) => i.id === Number(itemId));
        if (!item || !itemData.quantity || Number(itemData.quantity) <= 0) return null;

        return {
          id: `db-${item.id}`,
          name: item.name,
          quantity: Number(itemData.quantity),
          size: item.size_mode === "alpha" ? itemData.size || "M" : null,
          source: "database",
        };
      })
      .filter(Boolean);

    const customSummary = customItems.map((item, index) => ({
      id: `custom-${index}`,
      name: item.name,
      quantity: Number(item.quantity),
      size: null,
      source: "custom",
    }));

    return [...dbSummary, ...customSummary];
  }, [selectedItems, items, customItems]);

  const handleQuantityChange = (itemId, value) => {
    const quantity = Math.max(0, Number(value));
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity,
        size: prev[itemId]?.size || "M",
      },
    }));
  };

  const handleSizeChange = (itemId, value) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: prev[itemId]?.quantity || 0,
        size: value,
      },
    }));
  };

  const handleClearAll = () => {
    setSelectedItems({});
    setCustomItems([]);
    setSelectedPresetId("");
    setErrorMessage("");
  };

  const handleApplyPreset = (presetId) => {
    setSelectedPresetId(presetId);
    setErrorMessage("");
  
    if (!presetId) return;
  
    const preset = tripPresets.find((p) => p.id === presetId);
    if (!preset) return;
  
    const nextSelectedItems = {};
  
    preset.items.forEach((presetItem) => {
      const matchedItem = items.find(
        (dbItem) => dbItem.name.toLowerCase() === presetItem.itemName.toLowerCase()
      );
  
      if (matchedItem) {
        nextSelectedItems[matchedItem.id] = {
          quantity: presetItem.quantity,
          size: presetItem.size || "M",
        };
      }
    });
  
    setSelectedItems(nextSelectedItems);
    setCustomItems([]);
  };

  const handleCustomFormChange = (field, value) => {
    setCustomForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddCustomItem = () => {
    setErrorMessage("");

    if (!customForm.name.trim()) {
      setErrorMessage("Custom item name is required.");
      return;
    }

    if (
      Number(customForm.quantity) <= 0 ||
      Number(customForm.baseVolumeCm3) <= 0 ||
      Number(customForm.baseWeightG) < 0
    ) {
      setErrorMessage("Custom item quantity, volume, and weight must be valid.");
      return;
    }

    setCustomItems((prev) => [
      ...prev,
      {
        name: customForm.name.trim(),
        quantity: Number(customForm.quantity),
        baseVolumeCm3: Number(customForm.baseVolumeCm3),
        baseWeightG: Number(customForm.baseWeightG),
        packBehavior: customForm.packBehavior,
      },
    ]);

    setCustomForm({
      name: "",
      quantity: 1,
      baseVolumeCm3: "",
      baseWeightG: "",
      packBehavior: "semi-rigid",
    });
  };

  const handleRemoveCustomItem = (indexToRemove) => {
    setCustomItems((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCalculate = async () => {
    setErrorMessage("");

    const payloadItems = Object.entries(selectedItems)
      .map(([itemId, itemData]) => ({
        itemId: Number(itemId),
        quantity: Number(itemData.quantity || 0),
        size: itemData.size || null,
      }))
      .filter((item) => item.quantity > 0);

    if (payloadItems.length === 0 && customItems.length === 0) {
      setErrorMessage("Please add at least one item before calculating.");
      return;
    }

    try {
      setSubmitting(true);

      const requestBody = {
        selectedItems: payloadItems,
        customItems,
      };
      if (selectedSuitcase?.isCustom){
        requestBody.customSuitcase = selectedSuitcase;
      } else {
        requestBody.suitcaseId = selectedSuitcase.id;
      }
      const response = await api.post("/calculate", requestBody);

      localStorage.setItem("packingResults", JSON.stringify(response.data));
      localStorage.setItem("selectedItems", JSON.stringify(selectedItems));
      localStorage.setItem("customItems", JSON.stringify(customItems));
      navigate("/results");
    } catch (error) {
      console.error("Error calculating packing:", error);
      setErrorMessage("Something went wrong while calculating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Loading />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="section-title">Add Items</h1>
      <p className="page-subtitle">
        Add your clothes, accessories, and custom items, then calculate the best packing setup.
      </p>
      <div className="card items-top-box">
        <p>
          <strong>Selected Suitcase:</strong> {selectedSuitcase?.name}
        </p>
        <p>
          Volume: {selectedSuitcase?.volume_cm3} cm³ | Max Weight:{" "}
          {selectedSuitcase?.max_weight_kg} kg
        </p>
      </div>

      <div className="items-toolbar">
       <div className="control-group">
        <label>Search item:</label>
        <input
          type="text"
          placeholder="Search by item name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
       </div>

       <div className="control-group">
        <label>Filter by category:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
       </div>

       <div className="control-group">
        <label>Trip preset:</label>
        <select
          value={selectedPresetId}
          onChange={(e) => handleApplyPreset(e.target.value)}
        >
          <option value="">Choose preset</option>
          {tripPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
       </div>
       <div className="control-group">
        <label>Actions</label>
        <button className="primary-btn" onClick={handleClearAll}>
          Clear All
        </button>
       </div>
      </div>

      {errorMessage && (
        <div className="card" style={{ marginBottom: "16px", color: "crimson" }}>
          {errorMessage}
        </div>
      )}

      <div className="items-list">
        {filteredItems.length === 0 ? (
          <div className="card">
            <p>No items matched your search or category filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const currentItem = selectedItems[item.id] || {
              quantity: 0,
              size: "M",
            };

            return (
              <div key={item.id} className="card">
                <h3 className="item-card-title">{item.name}</h3>
                <p className="item-meta">
                  {item.category} • {item.pack_behavior}
                </p>
                <p className="item-meta">
                  Base volume: {item.base_volume_cm3} cm³ | Base weight:{" "}
                  {item.base_weight_g} g
                </p>

                <div className="item-controls">
                  <div className="control-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                    />
                  </div>

                  {item.size_mode === "alpha" && (
                    <div className="control-group">
                      <label>Size</label>
                      <select
                        value={currentItem.size}
                        onChange={(e) =>
                          handleSizeChange(item.id, e.target.value)
                        }
                      >
                        {sizeMultipliers.map((size) => (
                          <option key={size.id} value={size.size_code}>
                            {size.size_code}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card selected-summary">
        <h2 className="section-title">Add Custom Item</h2>

        <div className="item-controls">
          <div className="control-group">
            <label>Name</label>
            <input
              type="text"
              value={customForm.name}
              onChange={(e) => handleCustomFormChange("name", e.target.value)}
              placeholder="e.g. Perfume"
            />
          </div>

          <div className="control-group">
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={customForm.quantity}
              onChange={(e) => handleCustomFormChange("quantity", e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Volume (cm³)</label>
            <input
              type="number"
              min="1"
              value={customForm.baseVolumeCm3}
              onChange={(e) =>
                handleCustomFormChange("baseVolumeCm3", e.target.value)
              }
            />
          </div>

          <div className="control-group">
            <label>Weight (g)</label>
            <input
              type="number"
              min="0"
              value={customForm.baseWeightG}
              onChange={(e) =>
                handleCustomFormChange("baseWeightG", e.target.value)
              }
            />
          </div>

          <div className="control-group">
            <label>Behavior</label>
            <select
              value={customForm.packBehavior}
              onChange={(e) =>
                handleCustomFormChange("packBehavior", e.target.value)
              }
            >
              <option value="foldable">foldable</option>
              <option value="compressible">compressible</option>
              <option value="semi-rigid">semi-rigid</option>
              <option value="rigid">rigid</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "14px" }}>
          <button className="primary-btn" onClick={handleAddCustomItem}>
            Add Custom Item
          </button>
        </div>

        {customItems.length > 0 && (
          <div style={{ marginTop: "18px" }}>
            <h3>Custom Items Added</h3>
            <ul className="custom-items-list">
              {customItems.map((item, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>
                  {item.name} × {item.quantity} — {item.baseVolumeCm3} cm³ —{" "}
                  {item.baseWeightG} g — {item.packBehavior}{" "}
                  <button
                    onClick={() => handleRemoveCustomItem(index)}
                    style={{ marginLeft: "10px" }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card selected-summary">
        <h2 className="section-title">Selected Items Summary</h2>
        {selectedSummary.length === 0 ? (
          <p>No items selected yet.</p>
        ) : (
          <ul>
            {selectedSummary.map((item) => (
              <li key={item.id}>
                {item.name} × {item.quantity}
                {item.size ? ` (${item.size})` : ""}
                {item.source === "custom" ? " [custom]" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sticky-calc-bar">
        <div className="card sticky-calc-inner">
          <div>
            <div style={{ fontWeight: 700 }}>Ready to calculate?</div>
            <div className="sticky-calc-text">
              Review your selected items, then generate your suitcase plan.
            </div>
          </div>

          <div className="items-actions" style={{ marginTop: 0 }}>
            <button className="secondary-btn" onClick={() => navigate("/suitcases")}>
              Back
            </button>

            <button
              className="primary-btn"
              onClick={handleCalculate}
              disabled={submitting}
            >
              {submitting ? "Calculating..." : "Calculate Packing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemsPage;