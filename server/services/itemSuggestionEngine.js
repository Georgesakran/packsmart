function getQuantityByMode(days, mode, type) {
    const safeDays = Number(days || 1);
    const packingMode = (mode || "balanced").toLowerCase();
  
    if (type === "tshirt") {
      if (packingMode === "light") return Math.max(2, safeDays - 1);
      if (packingMode === "maximum_prepared") return safeDays + 1;
      if (packingMode === "carry_on_only") return Math.max(2, safeDays - 1);
      return safeDays;
    }
  
    if (type === "underwear") {
      if (packingMode === "light") return safeDays;
      if (packingMode === "maximum_prepared") return safeDays + 2;
      if (packingMode === "carry_on_only") return safeDays;
      return safeDays + 1;
    }
  
    if (type === "socks") {
      if (packingMode === "maximum_prepared") return safeDays + 1;
      return safeDays;
    }
  
    if (type === "pants") {
      if (safeDays <= 3) return 1;
      if (safeDays <= 6) return 2;
      return 3;
    }
  
    if (type === "shorts") {
      if (safeDays <= 3) return 1;
      if (safeDays <= 6) return 2;
      return 3;
    }
  
    return 1;
  }
  
  function buildWarnings(trip = {}, selectedBags = []) {
    const warnings = [];
    const duration = Number(trip.duration_days || 0);
    const packingMode = (trip.packing_mode || "balanced").toLowerCase();
  
    const bagTypes = selectedBags.map((b) => b.bag_type);
  
    if (duration >= 5 && bagTypes.length > 0 && bagTypes.every((t) => t === "personal_item")) {
      warnings.push("The selected bags may feel too small for a multi-day trip.");
    }
  
    if (packingMode === "maximum_prepared" && bagTypes.includes("personal_item") && !bagTypes.includes("checked_medium") && !bagTypes.includes("carry_on")) {
      warnings.push("Maximum prepared mode may be too ambitious for the selected bag setup.");
    }
  
    if (bagTypes.length === 0) {
      warnings.push("No selected bags were found for this trip yet.");
    }
  
    return warnings;
  }
  
  function groupItems(items = []) {
    return {
      essentials: items.filter((i) => i.group === "essentials"),
      clothing: items.filter((i) => i.group === "clothing"),
      toiletries: items.filter((i) => i.group === "toiletries"),
      tech: items.filter((i) => i.group === "tech"),
      accessories: items.filter((i) => i.group === "accessories"),
      shoes: items.filter((i) => i.group === "shoes"),
    };
  }
  
  function buildSuggestedItems({ trip, selectedBags = [], catalogMap = {} }) {
    const tripType = (trip.trip_type || trip.travel_type || "casual").toLowerCase();
    const days = Number(trip.duration_days || 1);
  
    const suggestions = [];
  
    const addItem = (name, quantity, group, isEssential = false) => {
      const item = catalogMap[name];
      if (!item || quantity <= 0) return;
  
      suggestions.push({
        itemId: item.id,
        customName: null,
        sourceType: "database",
        quantity,
        category: item.category,
        audience: item.audience || "unisex",
        sizeCode: null,
        baseVolumeCm3: item.base_volume_cm3,
        baseWeightG: item.base_weight_g,
        packBehavior: item.pack_behavior,
        isEssential,
        group,
        displayName: item.name,
      });
    };
  
    // Essentials
    addItem("Passport", 1, "essentials", true);
    addItem("Wallet", 1, "essentials", true);
    addItem("Travel Documents", 1, "essentials", true);
    addItem("Phone Charger", 1, "essentials", true);
  
    // Toiletries
    addItem("Toothbrush", 1, "toiletries", true);
    addItem("Toothpaste", 1, "toiletries", true);
    addItem("Deodorant", 1, "toiletries", true);
    addItem("Toiletry Pouch", 1, "toiletries", true);
  
    // Clothing defaults
    addItem("T-Shirt", getQuantityByMode(days, trip.packing_mode, "tshirt"), "clothing", true);
    addItem("Underwear", getQuantityByMode(days, trip.packing_mode, "underwear"), "clothing", true);
    addItem("Socks", getQuantityByMode(days, trip.packing_mode, "socks"), "clothing", true);
    addItem("Pants", getQuantityByMode(days, trip.packing_mode, "pants"), "clothing", true);
    addItem("Sleepwear", 1, "clothing", false);
  
    if (tripType === "beach") {
      addItem("Shorts", getQuantityByMode(days, trip.packing_mode, "shorts"), "clothing", true);
      addItem("Sunglasses", 1, "accessories", false);
      addItem("Sandals", 1, "shoes", false);
    } else if (tripType === "business") {
      addItem("Shirt", Math.max(2, Math.min(days, 4)), "clothing", true);
      addItem("Formal Shoes", 1, "shoes", false);
    } else if (tripType === "winter") {
      addItem("Hoodie", 1, "clothing", true);
      addItem("Jacket", 1, "clothing", true);
    } else {
      addItem("Hoodie", 1, "clothing", false);
      addItem("Sneakers", 1, "shoes", false);
      addItem("Sunglasses", 1, "accessories", false);
      addItem("Cap", 1, "accessories", false);
    }
  
    // Tech extras
    addItem("Power Bank", 1, "tech", false);
    addItem("Headphones", 1, "tech", false);
  
    return {
      grouped: groupItems(suggestions),
      flat: suggestions,
      warnings: buildWarnings(trip, selectedBags),
    };
  }
  
  module.exports = {
    buildSuggestedItems,
  };