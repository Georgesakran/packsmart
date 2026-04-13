function safeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }
  
  function prettifyZoneLabel(zoneKey = "") {
    return String(zoneKey)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  
  function getZoneKeyForItem(item = {}) {
    const name = String(item.name || "").toLowerCase();
    const category = String(item.category || "").toLowerCase();
    const travelDayMode = String(item.travelDayMode || item.travel_day_mode || "normal").toLowerCase();
  
    if (travelDayMode === "wear_on_travel_day") {
      return "wear_on_travel_day";
    }
  
    if (
      travelDayMode === "keep_accessible" ||
      category === "documents" ||
      name.includes("passport") ||
      name.includes("wallet") ||
      name.includes("document") ||
      name.includes("charger") ||
      name.includes("power bank") ||
      name.includes("headphones") ||
      name.includes("sunglasses")
    ) {
      return "quick_access";
    }
  
    if (
      category === "underwear" ||
      name.includes("sock") ||
      name.includes("underwear") ||
      name.includes("cable")
    ) {
      return "side_gaps";
    }
  
    if (
      category === "shoes" ||
      name.includes("shoe") ||
      name.includes("sneaker") ||
      name.includes("sandals") ||
      name.includes("toiletry pouch")
    ) {
      return "bottom_layer";
    }
  
    if (
      category === "bottoms" ||
      category === "outerwear" ||
      category === "clothing"
    ) {
      return "middle_layer";
    }
  
    if (category === "toiletries") {
      return "top_layer";
    }
  
    if (category === "accessories" || category === "tech") {
      return "quick_access";
    }
  
    return "top_layer";
  }
  
  function buildEmptyZones(availableVolumeCm3) {
    const total = safeNumber(availableVolumeCm3, 0);
  
    const zoneConfig = [
      { zoneKey: "bottom_layer", percent: 0.3 },
      { zoneKey: "middle_layer", percent: 0.3 },
      { zoneKey: "top_layer", percent: 0.2 },
      { zoneKey: "side_gaps", percent: 0.1 },
      { zoneKey: "quick_access", percent: 0.1 },
    ];
  
    return zoneConfig.map((zone) => {
      const capacityCm3 = Math.round(total * zone.percent);
  
      return {
        zoneKey: zone.zoneKey,
        zoneLabel: prettifyZoneLabel(zone.zoneKey),
        capacityCm3,
        usedCm3: 0,
        remainingCm3: capacityCm3,
        items: [],
      };
    });
  }
  
  function addItemToZone(zones, item, zoneKey) {
    const zone = zones.find((entry) => entry.zoneKey === zoneKey);
    if (!zone) return;
  
    const itemVolume = safeNumber(item.volumeCm3, 0);
  
    zone.items.push({
      tripItemId: item.id || null,
      itemId: item.itemId || null,
      name: item.name || "Item",
      quantity: safeNumber(item.quantity, 1),
      category: item.category || null,
      volumeCm3: itemVolume,
      weightG: safeNumber(item.weightG, 0),
      packingStatus: item.packingStatus || "pending",
      travelDayMode: item.travelDayMode || "normal",
      sizeCode: item.sizeCode || null,
      foldType: item.foldType || null,
    });
  
    zone.usedCm3 += itemVolume;
    zone.remainingCm3 = Math.max(0, zone.capacityCm3 - zone.usedCm3);
  }
  
  function buildPackingOrderFromBags(bags = []) {
    const orderedZoneKeys = [
      "bottom_layer",
      "middle_layer",
      "top_layer",
      "side_gaps",
      "quick_access",
    ];
  
    const steps = [];
    let stepNumber = 1;
  
    bags.forEach((bag) => {
      orderedZoneKeys.forEach((zoneKey) => {
        const zone = bag.zones.find((entry) => entry.zoneKey === zoneKey);
        if (!zone || !Array.isArray(zone.items) || zone.items.length === 0) return;
  
        zone.items.forEach((item) => {
          steps.push({
            stepNumber,
            bagId: bag.bagId,
            bagName: bag.bagName,
            zoneKey: zone.zoneKey,
            zoneLabel: zone.zoneLabel,
            tripItemId: item.tripItemId,
            itemId: item.itemId,
            itemName: item.name,
            quantity: item.quantity,
            instruction: `Place ${item.name} in the ${zone.zoneLabel} of ${bag.bagName}.`,
          });
          stepNumber += 1;
        });
      });
    });
  
    return steps;
  }
  
  function buildVisualPackingPlan({ selectedBags = [], calculationResult = {} }) {
    const bagResults = Array.isArray(calculationResult.bagResults)
      ? calculationResult.bagResults
      : [];
  
    const wearOnTravelDay = Array.isArray(calculationResult?.travelDay?.wornOnTravelDay)
      ? calculationResult.travelDay.wornOnTravelDay
      : [];
  
    const keepAccessible = Array.isArray(calculationResult?.travelDay?.keepAccessible)
      ? calculationResult.travelDay.keepAccessible
      : [];
  
    const overflow = Array.isArray(calculationResult.overflowItems)
      ? calculationResult.overflowItems
      : [];
  
    const bags = bagResults.map((bagResult) => {
      const matchedBag =
        selectedBags.find((bag) => Number(bag.id) === Number(bagResult.bagId)) || null;
  
      const zones = buildEmptyZones(bagResult.availableVolumeCm3);
  
      const bagItems = Array.isArray(bagResult.items) ? bagResult.items : [];
  
      bagItems.forEach((item) => {
        const zoneKey = getZoneKeyForItem(item);
        addItemToZone(zones, item, zoneKey);
      });
  
      return {
        bagId: bagResult.bagId,
        bagName: bagResult.bagName,
        bagType: bagResult.bagType || matchedBag?.bag_type || matchedBag?.bag_role || null,
        usedVolumeCm3: safeNumber(bagResult.usedVolumeCm3, 0),
        availableVolumeCm3: safeNumber(bagResult.availableVolumeCm3, 0),
        remainingVolumeCm3: safeNumber(bagResult.remainingVolumeCm3, 0),
        usedWeightG: safeNumber(bagResult.usedWeightG, 0),
        availableWeightG: safeNumber(bagResult.availableWeightG, 0),
        remainingWeightG: safeNumber(bagResult.remainingWeightG, 0),
        volumeUsagePercent: safeNumber(bagResult.volumeUsagePercent, 0),
        weightUsagePercent: safeNumber(bagResult.weightUsagePercent, 0),
        zones,
      };
    });
  
    const packingOrder = buildPackingOrderFromBags(bags);
  
    return {
      bags,
      wearOnTravelDay,
      keepAccessible,
      overflow,
      packingOrder,
    };
  }
  
  module.exports = {
    buildVisualPackingPlan,
  };