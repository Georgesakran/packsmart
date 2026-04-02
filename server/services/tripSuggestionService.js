import { enrichItemWithRules } from "./packingRulesEngine";

const clampMin = (value, min = 1) => Math.max(min, value);

const capByCategory = (name, quantity, days, weatherType = "mixed") => {
  const lower = name.toLowerCase();
  const tripTier = getTripLengthTier(days);

  if (lower === "underwear" || lower === "socks") {
    if (tripTier === "very_short") return clampMin(Math.min(quantity, 2));
    if (tripTier === "short") return clampMin(Math.min(quantity, 4));
    if (tripTier === "medium") return clampMin(Math.min(quantity, 6));
    if (tripTier === "long") return clampMin(Math.min(quantity, 8));
    return clampMin(Math.min(quantity, 10));
  }

  if (lower === "t-shirt" || lower === "shirt") {
    const base =
      weatherType === "hot"
        ? getLaundryAdjustedClothingCount(days, 0.85)
        : getLaundryAdjustedClothingCount(days, 0.7);

    return clampMin(Math.min(quantity, base));
  }

  if (lower === "jeans" || lower === "pants") {
    if (tripTier === "very_short") return clampMin(Math.min(quantity, 1));
    if (tripTier === "short") return clampMin(Math.min(quantity, 2));
    if (tripTier === "medium") return clampMin(Math.min(quantity, 3));
    if (tripTier === "long") return clampMin(Math.min(quantity, 4));
    return clampMin(Math.min(quantity, 5));
  }

  if (lower === "shorts") {
    const hotCap =
      tripTier === "very_short" ? 1 :
      tripTier === "short" ? 2 :
      tripTier === "medium" ? 3 :
      tripTier === "long" ? 4 : 5;

    const mildCap =
      tripTier === "very_short" ? 1 :
      tripTier === "short" ? 1 :
      tripTier === "medium" ? 2 :
      tripTier === "long" ? 3 : 4;

    return clampMin(Math.min(quantity, weatherType === "hot" ? hotCap : mildCap));
  }

  if (lower === "hoodie") {
    if (tripTier === "very_short") return clampMin(Math.min(quantity, 1));
    if (tripTier === "short") return clampMin(Math.min(quantity, 1));
    if (tripTier === "medium") return clampMin(Math.min(quantity, 2));
    return clampMin(Math.min(quantity, 2));
  }

  if (lower === "jacket") {
    return weatherType === "cold" || weatherType === "mixed" ? 1 : 0;
  }

  if (lower === "sneakers") {
    return 1;
  }

  if (lower === "toiletry bag") {
    return 1;
  }

  if (lower === "charger") {
    return 1;
  }

  return clampMin(quantity);
};

const applyTravelStyleAdjustments = (items, travelStyle, days, weatherType) => {
  const updated = [...items];
  const tripTier = getTripLengthTier(days);

  const changeQty = (name, updater) => {
    const item = updated.find((entry) => entry.name === name);
    if (!item) return;
    item.quantity = clampMin(updater(item.quantity));
  };

  switch (travelStyle) {
    case "minimal":
      changeQty("T-shirt", (q) => Math.max(1, q - 1));
      changeQty("Shirt", (q) => Math.max(1, q - 1));
      changeQty("Shorts", (q) => Math.max(1, q - 1));
      changeQty("Pants", (q) => Math.max(1, q - 1));
      changeQty("Hoodie", (q) => Math.max(0, q - 1));
      break;

    case "business":
      changeQty("Shirt", (q) => q + 1);
      changeQty("Pants", (q) => q + 1);
      changeQty("T-shirt", (q) => Math.max(1, q - 1));
      changeQty("Shorts", (q) => Math.max(0, q - 1));
      break;

    case "family":
      changeQty("Underwear", (q) => q + 1);
      changeQty("Socks", (q) => q + 1);
      if (tripTier === "long" || tripTier === "extended") {
        changeQty("Toiletry Bag", () => 1);
      }
      break;

    case "adventure":
      changeQty("Pants", (q) => q + 1);
      if (weatherType !== "hot") {
        changeQty("Hoodie", (q) => q + 1);
      }
      break;

    case "luxury":
      changeQty("Shirt", (q) => q + 1);
      changeQty("Jeans", (q) => q + 1);
      changeQty("Toiletry Bag", () => 1);
      break;

    case "casual":
    default:
      break;
  }

  return updated;
};

const getTripLengthTier = (days) => {
  if (days <= 2) return "very_short";
  if (days <= 4) return "short";
  if (days <= 7) return "medium";
  if (days <= 10) return "long";
  return "extended";
};

const getLaundryAdjustedClothingCount = (days, multiplier = 0.7) => {
  if (days <= 2) return Math.max(1, days);
  if (days <= 4) return Math.max(2, Math.ceil(days * multiplier));
  if (days <= 7) return Math.max(4, Math.ceil(days * multiplier));
  if (days <= 10) return Math.max(5, Math.ceil(days * 0.6));
  return Math.max(6, Math.ceil(days * 0.55));
};

const buildSuggestionRules = ({
  durationDays,
  travelType,
  weatherType,
  travelerCount,
  defaultSize,
  travelStyle,
}) => {
  const days = Number(durationDays) || 1;
  const travelers = Number(travelerCount) || 1;
  const preferredSize = defaultSize || "M";
  const tripTier = getTripLengthTier(days);

  const items = [];

  const addItem = (name, quantity, options = {}) => {
    const {
      multiplyByTravelers = true,
    } = options;

    const finalQty = multiplyByTravelers
      ? clampMin(Math.round(quantity * travelers))
      : clampMin(Math.round(quantity));

    const existing = items.find((item) => item.name === name);

    if (existing) {
      existing.quantity += finalQty;
    } else {
      items.push({ name, quantity: finalQty });
    }
  };

// Shared essentials
addItem("Toiletry Bag", travelers > 1 ? Math.ceil(travelers / 2) : 1, {
  multiplyByTravelers: false,
});
addItem("Charger", travelers > 1 ? Math.ceil(travelers / 2) : 1, {
  multiplyByTravelers: false,
});

// Personal essentials
if (tripTier === "very_short") {
  addItem("Underwear", 2);
  addItem("Socks", 2);
} else if (tripTier === "short") {
  addItem("Underwear", Math.min(days, 4));
  addItem("Socks", Math.min(days, 4));
} else if (tripTier === "medium") {
  addItem("Underwear", Math.min(days, 6));
  addItem("Socks", Math.min(days, 6));
} else if (tripTier === "long") {
  addItem("Underwear", 8);
  addItem("Socks", 8);
} else {
  addItem("Underwear", 10);
  addItem("Socks", 10);
}

  // Base trip logic
  switch (travelType) {
    case "beach":
      addItem("T-shirt", getLaundryAdjustedClothingCount(days, 0.9));
      addItem("Shorts", Math.max(2, Math.ceil(days * 0.6)));
      addItem("Jeans", days >= 4 ? 1 : 0);
      addItem("Sneakers", 1, { multiplyByTravelers: true });
      break;

    case "business":
      addItem("Shirt", getLaundryAdjustedClothingCount(days, 0.8));
      addItem("Pants", Math.max(1, Math.ceil(days / 3)));
      addItem("Sneakers", 1);
      break;

    case "winter":
      addItem("T-shirt", Math.max(2, Math.ceil(days * 0.5)));
      addItem("Jeans", Math.max(1, Math.ceil(days / 3)));
      addItem("Hoodie", Math.max(1, Math.ceil(days / 4)));
      addItem("Jacket", 1);
      addItem("Sneakers", 1);
      break;

    case "weekend":
      addItem("T-shirt", 2);
      addItem("Jeans", 1);
      addItem("Shorts", weatherType === "hot" ? 1 : 0);
      addItem("Sneakers", 1);
      break;

    case "adventure":
      addItem("T-shirt", Math.max(2, Math.ceil(days * 0.7)));
      addItem("Pants", Math.max(1, Math.ceil(days / 3)));
      addItem("Hoodie", 1);
      addItem("Sneakers", 1);
      break;

    case "family":
      addItem("T-shirt", Math.max(2, Math.ceil(days * 0.7)));
      addItem("Jeans", Math.max(1, Math.ceil(days / 3)));
      addItem("Shorts", Math.max(1, Math.ceil(days / 4)));
      addItem("Sneakers", 1);
      break;

    case "casual":
      default:
        addItem("T-shirt", getLaundryAdjustedClothingCount(days, weatherType === "hot" ? 0.85 : 0.7));
        addItem("Jeans", Math.max(1, Math.ceil(days / 4)));
        addItem("Shorts", weatherType === "hot" ? Math.max(1, Math.ceil(days / 3)) : 1);
        addItem("Sneakers", 1);
        break;
  }

  // Weather adjustments
  switch (weatherType) {
    case "cold":
      addItem("Hoodie", Math.max(1, Math.ceil(days / 4)));
      addItem("Jacket", 1);
      break;
  
    case "mild":
      if (days >= 3) addItem("Hoodie", 1);
      break;
  
    case "mixed":
      addItem("Hoodie", 1);
      if (days >= 5) addItem("Jacket", 1);
      break;
  
    case "hot":
    default:
      if (days >= 4) {
        addItem("Shorts", 1);
      }
      break;
  }

  // Remove zero-quantity accidental items
  let cleaned = items.filter((item) => item.quantity > 0);

  // Travel style adjustments
  cleaned = applyTravelStyleAdjustments(cleaned, travelStyle, days, weatherType);

  // Cap unrealistic quantities
  cleaned = cleaned.map((item) => ({
    ...item,
    quantity: capByCategory(item.name, item.quantity, days, weatherType),
  }));

  // Final dedupe safeguard
  const finalItems = [];
  for (const item of cleaned) {
    const existing = finalItems.find((x) => x.name === item.name);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      finalItems.push({ ...item });
    }
  }

  return finalItems.map((item) => 
    enrichItemWithRules({
      ...item,
      sizeCode: preferredSize,
    })
  );
  
};

module.exports = { buildSuggestionRules };