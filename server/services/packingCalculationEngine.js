// PackingCalculationEngine.js

function getPreferredBagTypesForItem(item) {
    const category = (item.category || "").toLowerCase();
    const travelDayMode = (item.travel_day_mode || "normal").toLowerCase();
  
    if (travelDayMode === "keep_accessible") {
      return ["personal_item", "carry_on", "checked_medium", "checked_large"];
    }
  
    if (category === "documents") {
      return ["personal_item", "carry_on"];
    }
  
    if (category === "tech") {
      return ["personal_item", "carry_on"];
    }
  
    if (category === "toiletries") {
      return ["carry_on", "personal_item", "checked_medium", "checked_large"];
    }
  
    if (category === "clothing") {
      return ["carry_on", "checked_medium", "checked_large", "personal_item"];
    }
  
    if (category === "shoes") {
      return ["carry_on", "checked_medium", "checked_large"];
    }
  
    if (category === "accessories") {
      return ["personal_item", "carry_on", "checked_medium"];
    }
  
    return ["carry_on", "personal_item", "checked_medium", "checked_large"];
  }
  
  function getItemDisplayName(item) {
    return item.custom_name || item.base_item_name || item.name || "Item";
  }
  
  function getItemPriorityScore(item) {
    let score = 0;
  
    const category = (item.category || "").toLowerCase();
    const packingStatus = (item.packing_status || "pending").toLowerCase();
    const travelDayMode = (item.travel_day_mode || "normal").toLowerCase();
  
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
  
  function normalizeBags(selectedBags = []) {
    return selectedBags.map((bag) => ({
      ...bag,
      availableVolumeCm3: Number(bag.volume_cm3 || 0),
      usedVolumeCm3: 0,
      availableWeightG: Number((bag.max_weight_kg || 0) * 1000),
      usedWeightG: 0,
      assignedItems: [],
    }));
  }
  
  function normalizeItems(tripItems = []) {
    return tripItems.map((item) => {
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
  
      const finalVolume =
        effectiveVolumeRaw > 1
          ? effectiveVolumeRaw
          : resolvedVolumeRaw > 1
          ? resolvedVolumeRaw
          : derivedVolumeFromDimensions > 1
          ? derivedVolumeFromDimensions
          : baseVolumeRaw > 1
          ? baseVolumeRaw
          : 1;
  
      const finalWeight =
        effectiveWeightRaw > 1
          ? effectiveWeightRaw
          : resolvedWeightRaw > 1
          ? resolvedWeightRaw
          : baseWeightRaw > 1
          ? baseWeightRaw
          : 1;

  
      return {
        ...item,
        displayName: getItemDisplayName(item),
        quantity: Number(item.quantity || 1),
        baseVolumeCm3: finalVolume,
        baseWeightG: finalWeight,
        resolvedSizeCode: item.resolved_size_code || item.size_code || null,
        resolvedFoldType: item.resolved_fold_type || item.fold_type || null,
        travel_day_mode: item.travel_day_mode || "normal",
        packing_status: item.packing_status || "pending",
        priorityScore: getItemPriorityScore(item),
      };
    });
  }
  
  function assignItemToBag(item, bags) {
    const preferredTypes = getPreferredBagTypesForItem(item);
  
    const itemTotalVolume = item.baseVolumeCm3 * item.quantity;
    const itemTotalWeight = item.baseWeightG * item.quantity;
  
    const sortedCandidateBags = [...bags]
      .filter((bag) => preferredTypes.includes((bag.bag_type || "").toLowerCase()))
      .sort((a, b) => {
        const aTypeIndex = preferredTypes.indexOf((a.bag_type || "").toLowerCase());
        const bTypeIndex = preferredTypes.indexOf((b.bag_type || "").toLowerCase());
  
        if (aTypeIndex !== bTypeIndex) return aTypeIndex - bTypeIndex;
  
        const aRemainingVolume = a.availableVolumeCm3 - a.usedVolumeCm3;
        const bRemainingVolume = b.availableVolumeCm3 - b.usedVolumeCm3;
  
        return bRemainingVolume - aRemainingVolume;
      });
  
    for (const bag of sortedCandidateBags) {
      const remainingVolume = bag.availableVolumeCm3 - bag.usedVolumeCm3;
      const remainingWeight = bag.availableWeightG - bag.usedWeightG;
  
      const fitsVolume = itemTotalVolume <= remainingVolume;
      const fitsWeight =
        bag.availableWeightG === 0 ? true : itemTotalWeight <= remainingWeight;
  
      if (fitsVolume && fitsWeight) {
        bag.usedVolumeCm3 += itemTotalVolume;
        bag.usedWeightG += itemTotalWeight;
        bag.assignedItems.push({
          id: item.id,
          itemId: item.item_id || null,
          name: item.displayName,
          quantity: item.quantity,
          category: item.category,
          volumeCm3: itemTotalVolume,
          weightG: itemTotalWeight,
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
      suggestions.push("Some items do not fit in the selected bags. Consider removing low-priority extras.");
    }
  
    if (wornOnTravelDay.length > 0) {
      suggestions.push("Items marked for travel day wear were excluded from bag volume, which improves fit.");
    }
  
    const heavyBag = bags.find(
      (bag) => bag.availableWeightG > 0 && bag.usedWeightG / bag.availableWeightG >= 0.9
    );
  
    if (heavyBag) {
      suggestions.push(`${heavyBag.name} is close to its weight limit.`);
    }
  
    const fullBag = bags.find(
      (bag) => bag.availableVolumeCm3 > 0 && bag.usedVolumeCm3 / bag.availableVolumeCm3 >= 0.9
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
      warnings.push(`${overflowItems.length} item${overflowItems.length === 1 ? "" : "s"} could not be assigned to the selected bags.`);
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
        bagType: bag.bag_type,
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
      const mode = (item.travel_day_mode || "normal").toLowerCase();
  
      if (mode === "wear_on_travel_day") {
        wornOnTravelDay.push({
          id: item.id,
          name: item.displayName,
          quantity: item.quantity,
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
      const result = assignItemToBag(item, bags);
  
      if (!result.assigned) {
        overflowItems.push({
          id: item.id,
          itemId: item.item_id || null,
          name: item.displayName,
          quantity: item.quantity,
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
    const totalFreeVolumeCm3 = Math.max(0, totalAvailableVolumeCm3 - totalUsedVolumeCm3);
  
    const totalAvailableWeightG = bagResults.reduce(
      (sum, bag) => sum + Number(bag.availableWeightG || 0),
      0
    );
    const totalUsedWeightG = bagResults.reduce(
      (sum, bag) => sum + Number(bag.usedWeightG || 0),
      0
    );
    const totalFreeWeightG = Math.max(0, totalAvailableWeightG - totalUsedWeightG);
  
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
          name: item.displayName,
          quantity: item.quantity,
          category: item.category,
        })),
      },
      fixSuggestions,
    };
  }
  
  module.exports = {
    calculatePackingResult,
  };