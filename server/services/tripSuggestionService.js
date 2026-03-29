const clampMin = (value, min = 1) => Math.max(min, value);

const capByCategory = (name, quantity, days) => {
  const lower = name.toLowerCase();

  if (lower === "underwear" || lower === "socks") {
    return clampMin(Math.min(quantity, Math.max(days, 2)));
  }

  if (lower === "t-shirt" || lower === "shirt") {
    return clampMin(Math.min(quantity, Math.max(2, Math.ceil(days * 0.7))));
  }

  if (lower === "jeans" || lower === "pants" || lower === "shorts") {
    return clampMin(Math.min(quantity, Math.max(1, Math.ceil(days / 3))));
  }

  if (lower === "hoodie") {
    return clampMin(Math.min(quantity, 2));
  }

  if (lower === "jacket") {
    return 1;
  }

  if (lower === "sneakers") {
    return 1;
  }

  if (lower === "toiletry bag" || lower === "charger") {
    return 1;
  }

  return clampMin(quantity);
};

const applyTravelStyleAdjustments = (items, travelStyle) => {
  const updated = [...items];

  const changeQty = (name, updater) => {
    const item = updated.find((entry) => entry.name === name);
    if (!item) return;
    item.quantity = clampMin(updater(item.quantity));
  };

  switch (travelStyle) {
    case "minimal":
      changeQty("T-shirt", (q) => q - 1);
      changeQty("Shirt", (q) => q - 1);
      changeQty("Shorts", (q) => q - 1);
      changeQty("Pants", (q) => q - 1);
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
      changeQty("Toiletry Bag", (q) => 1);
      break;

    case "casual":
    default:
      break;
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
  addItem("Underwear", Math.max(days, 2));
  addItem("Socks", Math.max(days, 2));

  // Base trip logic
  switch (travelType) {
    case "beach":
      addItem("T-shirt", Math.max(2, Math.ceil(days * 0.8)));
      addItem("Shorts", Math.max(2, Math.ceil(days * 0.5)));
      addItem("Jeans", days >= 4 ? 1 : 0);
      addItem("Sneakers", 1, { multiplyByTravelers: true });
      break;

    case "business":
      addItem("Shirt", Math.max(2, Math.ceil(days * 0.8)));
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
      addItem("T-shirt", Math.max(2, Math.ceil(days * 0.7)));
      addItem("Jeans", Math.max(1, Math.ceil(days / 4)));
      addItem("Shorts", weatherType === "hot" ? Math.max(1, Math.ceil(days / 4)) : 1);
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
      addItem("Hoodie", days >= 3 ? 1 : 0);
      break;

    case "mixed":
      addItem("Hoodie", 1);
      if (days >= 5) addItem("Jacket", 1);
      break;

    case "hot":
    default:
      break;
  }

  // Remove zero-quantity accidental items
  let cleaned = items.filter((item) => item.quantity > 0);

  // Travel style adjustments
  cleaned = applyTravelStyleAdjustments(cleaned, travelStyle);

  // Cap unrealistic quantities
  cleaned = cleaned.map((item) => ({
    ...item,
    quantity: capByCategory(item.name, item.quantity, days),
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

  return finalItems.map((item) => ({
    ...item,
    sizeCode: preferredSize,
  }));
};

module.exports = { buildSuggestionRules };