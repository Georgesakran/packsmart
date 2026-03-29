const clampMin = (value, min = 1) => Math.max(min, value);

const applyTravelStyleAdjustments = (items, travelStyle, days) => {
  const updated = [...items];

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
      changeQty("Underwear", (q) => Math.max(1, q));
      changeQty("Socks", (q) => Math.max(1, q));
      break;

    case "business":
      changeQty("Shirt", (q) => q + 1);
      changeQty("Pants", (q) => q + 1);
      changeQty("T-shirt", (q) => Math.max(1, q - 1));
      changeQty("Shorts", (q) => Math.max(1, q - 1));
      break;

    case "family":
      changeQty("Underwear", (q) => q + 1);
      changeQty("Socks", (q) => q + 1);
      break;

    case "adventure":
      changeQty("Pants", (q) => q + 1);
      changeQty("Hoodie", (q) => q + 1);
      break;

    case "luxury":
      changeQty("Shirt", (q) => q + 1);
      changeQty("Jeans", (q) => q + 1);
      changeQty("Toiletry Bag", (q) => q + 1);
      break;

    case "casual":
    default:
      break;
  }

  // extra normalization for very short trips
  if (days <= 2) {
    updated.forEach((item) => {
      item.quantity = clampMin(Math.min(item.quantity, 2));
    });
  }

  return updated;
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

  const base = [];

  const addItem = (name, quantity) => {
    const finalQty = clampMin(Math.round(quantity * travelers));
    const existing = base.find((item) => item.name === name);

    if (existing) {
      existing.quantity += finalQty;
    } else {
      base.push({ name, quantity: finalQty });
    }
  };

  // Essentials
  addItem("Underwear", days);
  addItem("Socks", days);
  addItem("Toiletry Bag", 1);
  addItem("Charger", 1);

  // Travel type rules
  switch (travelType) {
    case "beach":
      addItem("T-shirt", days);
      addItem("Shorts", Math.ceil(days * 0.6));
      addItem("Jeans", 1);
      addItem("Sneakers", 1);
      break;

    case "business":
      addItem("Shirt", days);
      addItem("Pants", Math.max(1, Math.ceil(days / 2)));
      addItem("Sneakers", 1);
      break;

    case "winter":
      addItem("T-shirt", Math.max(2, days - 1));
      addItem("Jeans", Math.max(1, Math.ceil(days / 2)));
      addItem("Hoodie", Math.max(1, Math.ceil(days / 3)));
      addItem("Jacket", 1);
      addItem("Sneakers", 1);
      break;

    case "weekend":
      addItem("T-shirt", Math.max(2, days));
      addItem("Jeans", 1);
      addItem("Shorts", 1);
      addItem("Sneakers", 1);
      break;

    case "adventure":
      addItem("T-shirt", days);
      addItem("Pants", Math.max(1, Math.ceil(days / 2)));
      addItem("Hoodie", 1);
      addItem("Sneakers", 1);
      break;

    case "family":
      addItem("T-shirt", days);
      addItem("Jeans", Math.max(1, Math.ceil(days / 2)));
      addItem("Shorts", Math.max(1, Math.ceil(days / 3)));
      addItem("Sneakers", 1);
      break;

    case "casual":
    default:
      addItem("T-shirt", days);
      addItem("Jeans", Math.max(1, Math.ceil(days / 3)));
      addItem("Shorts", Math.max(1, Math.ceil(days / 3)));
      addItem("Sneakers", 1);
      break;
  }

  // Weather rules
  switch (weatherType) {
    case "cold":
      addItem("Hoodie", Math.max(1, Math.ceil(days / 3)));
      addItem("Jacket", 1);
      break;

    case "mild":
      addItem("Hoodie", 1);
      break;

    case "mixed":
      addItem("Hoodie", 1);
      if (days >= 4) addItem("Jacket", 1);
      break;

    case "hot":
    default:
      break;
  }

  const adjusted = applyTravelStyleAdjustments(base, travelStyle, days);

  return adjusted.map((item) => ({
    ...item,
    sizeCode: preferredSize,
  }));
};

module.exports = { buildSuggestionRules };