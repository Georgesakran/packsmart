function safeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }
  
  function prettifyToken(value = "") {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  
  const BAG_CANVAS = {
    width: 320,
    height: 520,
    padding: 16,
  };
  
  const ZONE_LAYOUT = [
    {
      zoneKey: "quick_access",
      zoneLabel: "Quick Access",
      x: 16,
      y: 16,
      w: 288,
      h: 60,
    },
    {
      zoneKey: "top_layer",
      zoneLabel: "Top Layer",
      x: 16,
      y: 86,
      w: 288,
      h: 95,
    },
    {
      zoneKey: "middle_layer",
      zoneLabel: "Middle Layer",
      x: 16,
      y: 191,
      w: 288,
      h: 110,
    },
    {
      zoneKey: "bottom_layer",
      zoneLabel: "Bottom Layer",
      x: 16,
      y: 311,
      w: 288,
      h: 120,
    },
    {
      zoneKey: "side_gaps",
      zoneLabel: "Side Gaps",
      x: 16,
      y: 441,
      w: 288,
      h: 50,
    },
  ];
  
  const ZONE_SLOTS = {
    quick_access: [
      { slotKey: "quick_1", x: 24, y: 24, w: 58, h: 36 },
      { slotKey: "quick_2", x: 88, y: 24, w: 58, h: 36 },
      { slotKey: "quick_3", x: 152, y: 24, w: 58, h: 36 },
      { slotKey: "quick_4", x: 216, y: 24, w: 58, h: 36 },
    ],
    top_layer: [
      { slotKey: "top_left", x: 24, y: 96, w: 82, h: 40 },
      { slotKey: "top_center", x: 118, y: 96, w: 82, h: 40 },
      { slotKey: "top_right", x: 212, y: 96, w: 82, h: 40 },
      { slotKey: "top_bottom_left", x: 24, y: 142, w: 82, h: 28 },
      { slotKey: "top_bottom_center", x: 118, y: 142, w: 82, h: 28 },
      { slotKey: "top_bottom_right", x: 212, y: 142, w: 82, h: 28 },
    ],
    middle_layer: [
      { slotKey: "middle_left", x: 24, y: 205, w: 84, h: 46 },
      { slotKey: "middle_center", x: 118, y: 205, w: 84, h: 46 },
      { slotKey: "middle_right", x: 212, y: 205, w: 84, h: 46 },
      { slotKey: "middle_bottom_left", x: 24, y: 257, w: 84, h: 32 },
      { slotKey: "middle_bottom_center", x: 118, y: 257, w: 84, h: 32 },
      { slotKey: "middle_bottom_right", x: 212, y: 257, w: 84, h: 32 },
    ],
    bottom_layer: [
      { slotKey: "bottom_left", x: 24, y: 326, w: 84, h: 56 },
      { slotKey: "bottom_center", x: 118, y: 326, w: 84, h: 56 },
      { slotKey: "bottom_right", x: 212, y: 326, w: 84, h: 56 },
      { slotKey: "bottom_front_left", x: 24, y: 388, w: 84, h: 30 },
      { slotKey: "bottom_front_center", x: 118, y: 388, w: 84, h: 30 },
      { slotKey: "bottom_front_right", x: 212, y: 388, w: 84, h: 30 },
    ],
    side_gaps: [
      { slotKey: "gap_left_1", x: 24, y: 450, w: 58, h: 26 },
      { slotKey: "gap_left_2", x: 88, y: 450, w: 58, h: 26 },
      { slotKey: "gap_right_1", x: 152, y: 450, w: 58, h: 26 },
      { slotKey: "gap_right_2", x: 216, y: 450, w: 58, h: 26 },
    ],
  };
  
  function getItemOrientation(item = {}, zoneKey = "") {
    const category = String(item.category || "").toLowerCase();
    const name = String(item.name || "").toLowerCase();
  
    if (zoneKey === "side_gaps") return "rolled";
    if (zoneKey === "quick_access") return "upright";
  
    if (category === "shoes" || name.includes("shoe") || name.includes("sneaker")) {
      return "flat";
    }
  
    if (category === "documents") return "upright";
    if (category === "underwear") return "rolled";
    if (category === "tech") return "sideways";
    if (category === "bottoms" || category === "outerwear" || category === "clothing") {
      return "flat";
    }
  
    return "flat";
  }
  
  function getVisualSizeClass(item = {}) {
    const volume = safeNumber(item.volumeCm3, 0);
  
    if (volume <= 150) return "very_small";
    if (volume <= 500) return "small";
    if (volume <= 1500) return "medium";
    if (volume <= 3500) return "large";
    return "bulky";
  }
  
  function getVisualDimensions(item = {}, zoneKey = "") {
    const category = String(item.category || "").toLowerCase();
    const sizeClass = getVisualSizeClass(item);
  
    if (zoneKey === "quick_access") {
      if (category === "documents") return { w: 44, h: 24 };
      if (category === "tech") return { w: 46, h: 28 };
      return { w: 42, h: 24 };
    }
  
    if (zoneKey === "side_gaps") {
      if (category === "underwear") return { w: 34, h: 18 };
      return { w: 38, h: 18 };
    }
  
    if (category === "shoes") {
      return { w: 76, h: 42 };
    }
  
    if (category === "toiletries") {
      if (String(item.name || "").toLowerCase().includes("pouch")) {
        return { w: 72, h: 40 };
      }
      return { w: 44, h: 26 };
    }
  
    if (category === "documents") return { w: 40, h: 22 };
    if (category === "tech") return { w: 42, h: 24 };
    if (category === "underwear") return { w: 34, h: 18 };
    if (category === "accessories") return { w: 38, h: 22 };
  
    switch (sizeClass) {
      case "very_small":
        return { w: 34, h: 18 };
      case "small":
        return { w: 44, h: 24 };
      case "medium":
        return { w: 58, h: 30 };
      case "large":
        return { w: 72, h: 38 };
      case "bulky":
        return { w: 88, h: 44 };
      default:
        return { w: 50, h: 28 };
    }
  }
  
  function cloneZones() {
    return ZONE_LAYOUT.map((zone) => ({ ...zone }));
  }
  
  function cloneSlots() {
    return Object.fromEntries(
      Object.entries(ZONE_SLOTS).map(([zoneKey, slots]) => [
        zoneKey,
        slots.map((slot) => ({ ...slot, occupied: false })),
      ])
    );
  }
  
  function findAvailableSlot(zoneSlots = [], visualItem) {
    return (
      zoneSlots.find(
        (slot) =>
          !slot.occupied &&
          visualItem.w <= slot.w &&
          visualItem.h <= slot.h
      ) || null
    );
  }
  
  function buildBagSceneTemplate(bag) {
    return {
      bagId: bag.bagId,
      bagName: bag.bagName,
      bagType: bag.bagType,
      canvas: { ...BAG_CANVAS },
      zones: cloneZones(),
      slots: cloneSlots(),
      placedItems: [],
    };
  }
  
  function buildPlacedItem(item, zoneKey, slot, isCurrent = false) {
    const { w, h } = getVisualDimensions(item, zoneKey);
    return {
      tripItemId: item.tripItemId || item.id || null,
      itemId: item.itemId || null,
      name: item.name || "Item",
      category: item.category || null,
      quantity: safeNumber(item.quantity, 1),
      volumeCm3: safeNumber(item.volumeCm3, 0),
      weightG: safeNumber(item.weightG, 0),
      zoneKey,
      slotKey: slot.slotKey,
      x: slot.x,
      y: slot.y,
      w,
      h,
      orientation: getItemOrientation(item, zoneKey),
      isCurrent,
    };
  }
  
  function createSceneStatesByBag(visualPackingPlan) {
    const sceneStateMap = new Map();
  
    const bags = Array.isArray(visualPackingPlan?.bags) ? visualPackingPlan.bags : [];
  
    bags.forEach((bag) => {
      sceneStateMap.set(Number(bag.bagId), buildBagSceneTemplate(bag));
    });
  
    return sceneStateMap;
  }
  
  function placeItemIntoScene(sceneState, item, zoneKey) {
    const zoneSlots = sceneState.slots[zoneKey] || [];
    const dimensions = getVisualDimensions(item, zoneKey);
  
    const slot = findAvailableSlot(zoneSlots, dimensions);
    if (!slot) {
      return null;
    }
  
    slot.occupied = true;
  
    const placedItem = buildPlacedItem(item, zoneKey, slot, false);
    sceneState.placedItems.push(placedItem);
  
    return placedItem;
  }
  
  function buildSceneSnapshot(sceneState, currentTripItemId = null) {
    return {
      bagCanvas: { ...sceneState.canvas },
      zones: sceneState.zones.map((zone) => ({ ...zone })),
      placedItems: sceneState.placedItems.map((item) => ({
        ...item,
        isCurrent: Number(item.tripItemId) === Number(currentTripItemId),
      })),
    };
  }
  
  function buildPackingScene({ visualPackingPlan = null }) {
    if (!visualPackingPlan) {
      return {
        bags: [],
        steps: [],
      };
    }
  
    const bags = Array.isArray(visualPackingPlan.bags) ? visualPackingPlan.bags : [];
    const packingOrder = Array.isArray(visualPackingPlan.packingOrder)
      ? visualPackingPlan.packingOrder
      : [];
  
    const bagSceneStates = createSceneStatesByBag(visualPackingPlan);
    const steps = [];
  
    packingOrder.forEach((step) => {
      const bagId = Number(step.bagId);
      const zoneKey = step.zoneKey;
  
      const bagPlan = bags.find((bag) => Number(bag.bagId) === bagId) || null;
      const zonePlan = bagPlan?.zones?.find((zone) => zone.zoneKey === zoneKey) || null;
      const itemPlan =
        zonePlan?.items?.find(
          (item) =>
            Number(item.tripItemId) === Number(step.tripItemId) &&
            String(item.name) === String(step.itemName)
        ) || null;
  
      const sceneState = bagSceneStates.get(bagId);
      if (!sceneState || !itemPlan) {
        return;
      }
  
      const placedItem = placeItemIntoScene(sceneState, itemPlan, zoneKey);
      if (!placedItem) {
        return;
      }
  
      const frame = buildSceneSnapshot(sceneState, step.tripItemId);
  
      steps.push({
        stepNumber: step.stepNumber,
        bagId: step.bagId,
        bagName: step.bagName,
        zoneKey: step.zoneKey,
        zoneLabel: step.zoneLabel || prettifyToken(step.zoneKey),
        tripItemId: step.tripItemId || null,
        itemId: step.itemId || null,
        itemName: step.itemName || "Item",
        quantity: safeNumber(step.quantity, 1),
        orientation: placedItem.orientation,
        placementInstruction: step.instruction,
        frame,
      });
    });
  
    return {
      bags: bags.map((bag) => ({
        bagId: bag.bagId,
        bagName: bag.bagName,
        bagType: bag.bagType,
        canvas: { ...BAG_CANVAS },
        zones: cloneZones(),
      })),
      steps,
    };
  }
  
  module.exports = {
    buildPackingScene,
  };