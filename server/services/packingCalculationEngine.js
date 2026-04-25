//packingCalculationEngine.js
function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function getBagType(bag = {}) {
  return normalizeText(bag.bag_type || bag.bag_role || bag.role_label || "carry_on");
}

function getPreferredBagTypesForItem(item) {
  const category = normalizeText(item.category);
  const travelDayMode = normalizeText(item.travel_day_mode || "normal");

  if (travelDayMode === "keep_accessible") {
    return ["personal_item", "personal", "carry_on", "checked_medium", "checked_large", "main"];
  }

  if (category === "documents") {
    return ["personal_item", "personal", "carry_on"];
  }

  if (category === "tech") {
    return ["personal_item", "personal", "carry_on"];
  }

  if (category === "toiletries") {
    return ["carry_on", "personal_item", "personal", "checked_medium", "checked_large", "main"];
  }

  if (category === "clothing") {
    return ["carry_on", "checked_medium", "checked_large", "main", "personal_item", "personal"];
  }

  if (category === "shoes") {
    return ["carry_on", "checked_medium", "checked_large", "main"];
  }

  if (category === "accessories") {
    return ["personal_item", "personal", "carry_on", "checked_medium", "main"];
  }

  return ["carry_on", "personal_item", "personal", "checked_medium", "checked_large", "main"];
}

function getItemDisplayName(item) {
  return item.custom_name || item.base_item_name || item.name || "Item";
}

function getItemPriorityScore(item) {
  let score = 0;

  const category = normalizeText(item.category);
  const packingStatus = normalizeText(item.packing_status || "pending");
  const travelDayMode = normalizeText(item.travel_day_mode || "normal");

  if (travelDayMode === "keep_accessible") score += 100;
  if (category === "documents") score += 95;
  if (category === "tech") score += 80;
  if (category === "toiletries") score += 65;
  if (category === "clothing") score += 50;
  if (category === "shoes") score += 40;
  if (category === "accessories") score += 30;

  if (packingStatus === "packed") score -= 10;

  return score;
}

function normalizeInnerBagDimensionsCm(bag = {}) {
  const outerLength = Number(bag.length_cm || 55);
  const outerWidth = Number(bag.width_cm || 35);
  const outerHeight = Number(bag.height_cm || 23);

  return {
    length: outerLength,
    width: Math.max(12, outerWidth - 2),
    height: Math.max(12, outerLength - 4),
    depth: Math.max(10, outerHeight - 2),
  };
}

function getAuthoritativeBagVolumeCm3(bag = {}) {
  const inner = normalizeInnerBagDimensionsCm(bag);
  return Math.round(
    Number(inner.width || 0) *
      Number(inner.height || 0) *
      Number(inner.depth || 0)
  );
}

function normalizeBags(selectedBags = []) {
  return selectedBags.map((bag) => {
    const authoritativeVolumeCm3 =
      Number(bag.length_cm || 0) > 0 &&
      Number(bag.width_cm || 0) > 0 &&
      Number(bag.height_cm || 0) > 0
        ? getAuthoritativeBagVolumeCm3(bag)
        : Number(bag.volume_cm3 || 0);

    return {
      ...bag,
      bagTypeNormalized: getBagType(bag),
      availableVolumeCm3: authoritativeVolumeCm3,
      usedVolumeCm3: 0,
      availableWeightG: Number((bag.max_weight_kg || 0) * 1000),
      usedWeightG: 0,
      assignedItems: [],
    };
  });
}

function expandTripItemToUnits(item) {
  const quantity = Math.max(1, Number(item.quantity || 1));
  const displayName = getItemDisplayName(item);

  const resolvedDimensions = item.resolved_dimensions_cm || null;

  const derivedVolumeFromDimensions =
    resolvedDimensions &&
    resolvedDimensions.w != null &&
    resolvedDimensions.h != null &&
    resolvedDimensions.d != null
      ? Math.round(
          Number(resolvedDimensions.w || 0) *
            Number(resolvedDimensions.h || 0) *
            Number(resolvedDimensions.d || 0)
        )
      : 0;

  const effectiveVolumeRaw = Number(item.effective_volume_cm3 || 0);
  const resolvedVolumeRaw = Number(item.resolved_volume_cm3 || 0);
  const baseVolumeRaw = Number(item.base_volume_cm3 || 0);

  const effectiveWeightRaw = Number(item.effective_weight_g || 0);
  const resolvedWeightRaw = Number(item.resolved_weight_g || 0);
  const baseWeightRaw = Number(item.base_weight_g || 0);

  const finalUnitVolume =
    effectiveVolumeRaw > 1
      ? effectiveVolumeRaw
      : resolvedVolumeRaw > 1
      ? resolvedVolumeRaw
      : derivedVolumeFromDimensions > 1
      ? derivedVolumeFromDimensions
      : baseVolumeRaw > 1
      ? baseVolumeRaw
      : 1;

  const finalUnitWeight =
    effectiveWeightRaw > 1
      ? effectiveWeightRaw
      : resolvedWeightRaw > 1
      ? resolvedWeightRaw
      : baseWeightRaw > 1
      ? baseWeightRaw
      : 1;

  const units = [];

  for (let index = 0; index < quantity; index += 1) {
    units.push({
      ...item,
      displayName,
      quantity: 1,
      originalQuantity: quantity,
      unitIndex: index + 1,
      sceneItemId: `${item.id}-${index + 1}`,
      baseVolumeCm3: Math.round(finalUnitVolume),
      baseWeightG: Math.round(finalUnitWeight),
      resolvedSizeCode: item.resolved_size_code || item.size_code || null,
      resolvedFoldType: item.resolved_fold_type || item.fold_type || null,
      travel_day_mode: item.travel_day_mode || "normal",
      packing_status: item.packing_status || "pending",
      priorityScore: getItemPriorityScore(item),
    });
  }

  return units;
}

function normalizeItems(tripItems = []) {
  return tripItems.flatMap(expandTripItemToUnits);
}

function assignUnitToBag(item, bags) {
  const preferredTypes = getPreferredBagTypesForItem(item);

  const itemVolume = Number(item.baseVolumeCm3 || 0);
  const itemWeight = Number(item.baseWeightG || 0);

  const sortedCandidateBags = [...bags]
    .filter((bag) => preferredTypes.includes(bag.bagTypeNormalized))
    .sort((a, b) => {
      const aTypeIndex = preferredTypes.indexOf(a.bagTypeNormalized);
      const bTypeIndex = preferredTypes.indexOf(b.bagTypeNormalized);

      if (aTypeIndex !== bTypeIndex) return aTypeIndex - bTypeIndex;

      const aRemainingVolume = a.availableVolumeCm3 - a.usedVolumeCm3;
      const bRemainingVolume = b.availableVolumeCm3 - b.usedVolumeCm3;

      return bRemainingVolume - aRemainingVolume;
    });

  for (const bag of sortedCandidateBags) {
    const remainingVolume = bag.availableVolumeCm3 - bag.usedVolumeCm3;
    const remainingWeight = bag.availableWeightG - bag.usedWeightG;

    const fitsVolume = itemVolume <= remainingVolume;
    const fitsWeight =
      bag.availableWeightG === 0 ? true : itemWeight <= remainingWeight;

    if (fitsVolume && fitsWeight) {
      bag.usedVolumeCm3 += itemVolume;
      bag.usedWeightG += itemWeight;

      bag.assignedItems.push({
        id: item.id,
        sceneItemId: item.sceneItemId,
        unitIndex: item.unitIndex,
        itemId: item.item_id || null,
        name: item.displayName,
        category: item.category,
        quantity: 1,
        volumeCm3: itemVolume,
        weightG: itemWeight,
        travelDayMode: item.travel_day_mode,
        packingStatus: item.packing_status,
        sizeCode: item.resolvedSizeCode || null,
        foldType: item.resolvedFoldType || null,
      });

      return {
        assigned: true,
        bagId: bag.id,
        bagName: bag.name,
      };
    }
  }

  return {
    assigned: false,
    reason: "Not enough remaining space or weight capacity in selected bags.",
  };
}

function buildFixSuggestions({ overflowItems = [], wornOnTravelDay = [], bags = [] }) {
  const suggestions = [];

  if (overflowItems.length > 0) {
    suggestions.push(
      "Some items do not fit in the selected bags. Consider removing low-priority extras."
    );
  }

  if (wornOnTravelDay.length > 0) {
    suggestions.push(
      "Items marked for travel day wear were excluded from bag volume, which improves fit."
    );
  }

  const heavyBag = bags.find(
    (bag) =>
      bag.availableWeightG > 0 &&
      bag.usedWeightG / bag.availableWeightG >= 0.9
  );

  if (heavyBag) {
    suggestions.push(`${heavyBag.name} is close to its weight limit.`);
  }

  const fullBag = bags.find(
    (bag) =>
      bag.availableVolumeCm3 > 0 &&
      bag.usedVolumeCm3 / bag.availableVolumeCm3 >= 0.9
  );

  if (fullBag) {
    suggestions.push(`${fullBag.name} is close to full volume capacity.`);
  }

  return suggestions;
}

function buildWarnings({ overflowItems = [], bags = [] }) {
  const warnings = [];

  if (bags.length === 0) {
    warnings.push("No selected bags were found for this trip.");
  }

  if (overflowItems.length > 0) {
    warnings.push(
      `${overflowItems.length} item${overflowItems.length === 1 ? "" : "s"} could not be assigned to the selected bags.`
    );
  }

  bags.forEach((bag) => {
    const volumeUsage =
      bag.availableVolumeCm3 > 0
        ? Math.round((bag.usedVolumeCm3 / bag.availableVolumeCm3) * 100)
        : 0;

    const weightUsage =
      bag.availableWeightG > 0
        ? Math.round((bag.usedWeightG / bag.availableWeightG) * 100)
        : 0;

    if (volumeUsage >= 90) {
      warnings.push(`${bag.name} is above 90% of its volume capacity.`);
    }

    if (bag.availableWeightG > 0 && weightUsage >= 90) {
      warnings.push(`${bag.name} is above 90% of its weight capacity.`);
    }
  });

  return warnings;
}

function buildBagResults(bags = []) {
  return bags.map((bag) => {
    const volumeUsagePercent =
      bag.availableVolumeCm3 > 0
        ? Math.round((bag.usedVolumeCm3 / bag.availableVolumeCm3) * 100)
        : 0;

    const weightUsagePercent =
      bag.availableWeightG > 0
        ? Math.round((bag.usedWeightG / bag.availableWeightG) * 100)
        : 0;

    return {
      bagId: bag.id,
      bagName: bag.name,
      bagType: bag.bagTypeNormalized,
      usedVolumeCm3: bag.usedVolumeCm3,
      availableVolumeCm3: bag.availableVolumeCm3,
      remainingVolumeCm3: Math.max(0, bag.availableVolumeCm3 - bag.usedVolumeCm3),
      usedWeightG: bag.usedWeightG,
      availableWeightG: bag.availableWeightG,
      remainingWeightG: Math.max(0, bag.availableWeightG - bag.usedWeightG),
      volumeUsagePercent,
      weightUsagePercent,
      items: bag.assignedItems,
    };
  });
}

function calculatePackingResult({ trip, selectedBags = [], tripItems = [] }) {
  const bags = normalizeBags(selectedBags);
  const items = normalizeItems(tripItems);

  const wornOnTravelDay = [];
  const keepAccessible = [];
  const normalItems = [];

  items.forEach((item) => {
    const mode = normalizeText(item.travel_day_mode || "normal");

    if (mode === "wear_on_travel_day") {
      wornOnTravelDay.push({
        id: item.id,
        sceneItemId: item.sceneItemId,
        unitIndex: item.unitIndex,
        name: item.displayName,
        quantity: 1,
        category: item.category,
      });
    } else if (mode === "keep_accessible") {
      keepAccessible.push(item);
    } else {
      normalItems.push(item);
    }
  });

  const itemsToAssign = [...keepAccessible, ...normalItems].sort(
    (a, b) => b.priorityScore - a.priorityScore
  );

  const overflowItems = [];

  itemsToAssign.forEach((item) => {
    const result = assignUnitToBag(item, bags);

    if (!result.assigned) {
      overflowItems.push({
        id: item.id,
        sceneItemId: item.sceneItemId,
        unitIndex: item.unitIndex,
        itemId: item.item_id || null,
        name: item.displayName,
        quantity: 1,
        category: item.category,
        reason: result.reason,
      });
    }
  });

  const bagResults = buildBagResults(bags);

  const totalAvailableVolumeCm3 = bagResults.reduce(
    (sum, bag) => sum + Number(bag.availableVolumeCm3 || 0),
    0
  );

  const totalUsedVolumeCm3 = bagResults.reduce(
    (sum, bag) => sum + Number(bag.usedVolumeCm3 || 0),
    0
  );

  const totalFreeVolumeCm3 = Math.max(
    0,
    totalAvailableVolumeCm3 - totalUsedVolumeCm3
  );

  const totalAvailableWeightG = bagResults.reduce(
    (sum, bag) => sum + Number(bag.availableWeightG || 0),
    0
  );

  const totalUsedWeightG = bagResults.reduce(
    (sum, bag) => sum + Number(bag.usedWeightG || 0),
    0
  );

  const totalFreeWeightG = Math.max(
    0,
    totalAvailableWeightG - totalUsedWeightG
  );

  const warnings = buildWarnings({
    overflowItems,
    bags,
  });

  const fixSuggestions = buildFixSuggestions({
    overflowItems,
    wornOnTravelDay,
    bags,
  });

  const overallFits = overflowItems.length === 0;

  return {
    overallFits,
    totalAvailableVolumeCm3,
    totalUsedVolumeCm3,
    totalFreeVolumeCm3,
    totalAvailableWeightG,
    totalUsedWeightG,
    totalFreeWeightG,
    overflowItemCount: overflowItems.length,
    wornOnTravelDayCount: wornOnTravelDay.length,
    warnings,
    overflowItems,
    bagResults,
    travelDay: {
      wornOnTravelDay,
      keepAccessible: keepAccessible.map((item) => ({
        id: item.id,
        sceneItemId: item.sceneItemId,
        unitIndex: item.unitIndex,
        name: item.displayName,
        quantity: 1,
        category: item.category,
      })),
    },
    fixSuggestions,
  };
}

module.exports = {
  calculatePackingResult,
};