const getPackingPriority = (item) => {
    const name = (item.name || "").toLowerCase();
  
    if (item.packBehavior === "rigid") return 1;
  
    if (
      name.includes("jacket") ||
      name.includes("hoodie") ||
      item.finalVolumeCm3 >= 5000
    ) {
      return 2;
    }
  
    if (item.packBehavior === "foldable") return 3;
    if (item.packBehavior === "compressible") return 4;
  
    return 5;
  };
  
  const getPackingZone = (item) => {
    const name = (item.name || "").toLowerCase();
  
    if (item.packBehavior === "rigid" && item.category === "shoes") {
      return "bottom or edges";
    }
  
    if (item.packBehavior === "rigid") {
      return "bottom layer";
    }
  
    if (
      name.includes("jacket") ||
      name.includes("hoodie") ||
      item.finalVolumeCm3 >= 5000
    ) {
      return "bottom or middle layer";
    }
  
    if (item.packBehavior === "foldable") {
      return "middle layer";
    }
  
    if (item.packBehavior === "compressible") {
      return "corners and gaps";
    }
  
    return "middle layer";
  };
  
  const getPackingInstruction = (item) => {
    const name = (item.name || "").toLowerCase();
  
    if (item.packBehavior === "rigid" && item.category === "shoes") {
      return "Place shoes at the bottom or edges to build the base structure.";
    }
  
    if (item.packBehavior === "rigid") {
      return "Pack rigid items first so softer items can fit around them.";
    }
  
    if (name.includes("jacket") || name.includes("hoodie")) {
      return "Place bulky outerwear early so it does not crush smaller packed items.";
    }
  
    if (item.packBehavior === "foldable") {
      return "Fold neatly and stack in the middle layer.";
    }
  
    if (item.packBehavior === "compressible") {
      return "Use this item last to fill small gaps.";
    }
  
    return "Pack this item in the middle area of the suitcase.";
  };
  
  const getLayoutSection = (item, index) => {
    const zone = getPackingZone(item);
  
    if (zone === "bottom layer") return "bottomLayer";
    if (zone === "corners and gaps") return "cornersAndGaps";
    if (zone === "bottom or middle layer") return "middleLayer";
  
    if (zone === "bottom or edges") {
      return index % 2 === 0 ? "leftSide" : "rightSide";
    }
  
    return index % 2 === 0 ? "leftSide" : "rightSide";
  };
  
  const getSmartAdvice = (items, totals, suitcase) => {
    const advice = [];
  
    const rigidItems = items.filter((item) => item.packBehavior === "rigid");
    const bulkyItems = items.filter(
      (item) =>
        item.finalVolumeCm3 >= 5000 ||
        (item.name || "").toLowerCase().includes("jacket") ||
        (item.name || "").toLowerCase().includes("hoodie")
    );
  
    const shoesCount = items
      .filter((item) => item.category === "shoes")
      .reduce((sum, item) => sum + item.quantity, 0);
  
    const customHeavyItems = items.filter(
      (item) => item.source === "custom" && item.finalWeightG >= 1000
    );
  
    if (!totals.overallFits) {
      advice.push("Your selected items may not fit well in this suitcase.");
    }
  
    if (!totals.volumeFits) {
      advice.push("Your packing volume is over the suitcase limit. Reduce bulky items first.");
    }
  
    if (!totals.weightFits) {
      advice.push("Your luggage may exceed the airline weight limit. Remove heavier items first.");
    }
  
    if (totals.usedCapacityPercent >= 90 && totals.usedCapacityPercent <= 100) {
      advice.push("Your suitcase is almost full. Leave a little extra space for easier closing.");
    }
  
    if (totals.usedCapacityPercent > 100) {
      advice.push("Your suitcase is overfilled. Consider a larger suitcase or fewer items.");
    }
  
    const weightUsagePercent = (totals.weightKg / Number(suitcase.max_weight_kg)) * 100;
  
    if (weightUsagePercent >= 85 && weightUsagePercent <= 100) {
      advice.push("Your luggage is getting close to the weight limit.");
    }
  
    if (rigidItems.length >= 3) {
      advice.push("You have several rigid items. Pack them first to avoid wasted space.");
    }
  
    if (bulkyItems.length >= 2) {
      advice.push("You have multiple bulky items. Try wearing one of them during travel.");
    }
  
    if (shoesCount >= 2) {
      advice.push("Multiple pairs of shoes take a lot of space. Pack shoes at the edges or bottom.");
    } else if (shoesCount === 1) {
      advice.push("Place shoes at the bottom or edges of the suitcase.");
    }
  
    if (items.some((item) => item.packBehavior === "compressible")) {
      advice.push("Use socks and underwear to fill empty corners and gaps.");
    }
  
    if (
      items.some(
        (item) =>
          item.category === "accessories" ||
          item.category === "custom" ||
          (item.name || "").toLowerCase().includes("toiletry")
      )
    ) {
      advice.push("Keep toiletries and small essentials near the top for easy access.");
    }
  
    if (customHeavyItems.length > 0) {
      advice.push("One or more custom items are heavy. Double-check their weight before traveling.");
    }
  
    advice.push("Pack heavier items first and lighter items on top.");
  
    return [...new Set(advice)];
  };

  const getMainConstraint = (totals) => {
    const volumeOver = totals.totalVolumeCm3 - totals.totalAvailableVolumeCm3;
    const weightOverG = totals.totalWeightG - totals.totalAllowedWeightG;
  
    if (volumeOver > 0 && weightOverG > 0) return "both";
    if (volumeOver > 0) return "volume";
    if (weightOverG > 0) return "weight";
    return "none";
  };
  
  const buildAdjustmentSuggestions = (items, totals) => {
    const mainConstraint = getMainConstraint(totals);
  
    const sortedByVolume = [...items].sort((a, b) => b.finalVolumeCm3 - a.finalVolumeCm3);
    const sortedByWeight = [...items].sort((a, b) => b.finalWeightG - a.finalWeightG);
  
    const adjustments = [];
    const warnings = [];
    const optimizationTips = [];
  
    if (mainConstraint === "volume" || mainConstraint === "both") {
      const bulky = sortedByVolume.filter(
        (item) =>
          item.finalVolumeCm3 >= 4000 ||
          item.category === "outerwear" ||
          item.category === "shoes"
      );
  
      if (bulky[0]) {
        adjustments.push(
          `Remove or reduce ${bulky[0].name} first to lower suitcase volume.`
        );
      }
  
      if (bulky[1]) {
        adjustments.push(
          `Consider reducing ${bulky[1].name} if you still need more space.`
        );
      }
  
      const foldableLarge = sortedByVolume.find(
        (item) =>
          item.packBehavior === "foldable" &&
          item.quantity > 1 &&
          item.finalVolumeCm3 >= 2500
      );
  
      if (foldableLarge) {
        adjustments.push(
          `Reduce the quantity of ${foldableLarge.name} to free up more packing space.`
        );
      }
  
      warnings.push("Your main packing issue is suitcase volume.");
    }
  
    if (mainConstraint === "weight" || mainConstraint === "both") {
      const heavy = sortedByWeight.filter(
        (item) =>
          item.finalWeightG >= 800 ||
          item.category === "shoes" ||
          item.category === "outerwear"
      );
  
      if (heavy[0]) {
        adjustments.push(
          `Remove or reduce ${heavy[0].name} first to lower total weight.`
        );
      }
  
      if (heavy[1]) {
        adjustments.push(
          `Check whether ${heavy[1].name} is necessary for this trip.`
        );
      }
  
      const heavyCustom = sortedByWeight.find(
        (item) => item.source === "custom" && item.finalWeightG >= 1000
      );
  
      if (heavyCustom) {
        adjustments.push(
          `Review the custom item ${heavyCustom.name}, as it adds significant weight.`
        );
      }
  
      warnings.push("Your main packing issue is total weight.");
    }
  
    if (totals.usedCapacityPercent >= 85 && totals.usedCapacityPercent <= 100) {
      optimizationTips.push(
        "Your suitcase is close to full capacity. Keep a little free space for easier closing."
      );
    }
  
    if (totals.weightKg >= Number(suitcase.max_weight_kg) * 0.85) {
      optimizationTips.push(
        "Your packed weight is close to the suitcase limit. Avoid adding more heavy items."
      );
    }
  
    const repeatedItems = items.filter(
      (item) =>
        item.quantity >= 3 &&
        (item.category === "tops" || item.category === "bottoms")
    );
  
    if (repeatedItems[0]) {
      optimizationTips.push(
        `You may be able to reduce the quantity of ${repeatedItems[0].name} without affecting the trip too much.`
      );
    }
  
    const shoes = items.find((item) => item.category === "shoes");
    if (shoes && shoes.quantity >= 1) {
      optimizationTips.push(
        "Shoes take a large amount of space. Pack only the pairs you really need."
      );
    }
  
    return {
      mainConstraint,
      warnings: [...new Set(warnings)],
      adjustments: [...new Set(adjustments)].slice(0, 5),
      optimizationTips: [...new Set(optimizationTips)].slice(0, 5),
    };
  };

  const calculateTripResult = ({ suitcases, tripItems, sizeMultipliers }) => {
    const totalAvailableVolumeCm3 = suitcases.reduce(
      (sum, bag) => sum + Number(bag.volume_cm3 || 0),
      0
    );
    
    const totalAvailableWeightG = suitcases.reduce(
      (sum, bag) => sum + Number(bag.max_weight_kg || 0) * 1000,
      0
    );
    
    const primarySuitcase =
      suitcases.find((bag) => bag.is_primary) || suitcases[0];

    const sizeMap = {};
    sizeMultipliers.forEach((size) => {
      sizeMap[size.size_code] = Number(size.multiplier);
    });
  
    let totalVolumeCm3 = 0;
    let totalWeightG = 0;
  
    const detailedItems = tripItems.map((item) => {
      const sizeMultiplier =
        item.size_code && sizeMap[item.size_code] ? sizeMap[item.size_code] : 1;
  
      const quantity = Number(item.quantity) || 0;
      const itemVolume = Number(item.base_volume_cm3) * sizeMultiplier * quantity;
      const itemWeight = Number(item.base_weight_g) * sizeMultiplier * quantity;
  
      totalVolumeCm3 += itemVolume;
      totalWeightG += itemWeight;
  
      return {
        tripItemId: item.id,
        itemId: item.item_id,
        name: item.custom_name || item.base_item_name || "Custom Item",
        category: item.category || "custom",
        quantity,
        selectedSize: item.size_code || null,
        sizeMultiplier,
        baseVolumeCm3: Number(item.base_volume_cm3),
        baseWeightG: Number(item.base_weight_g),
        finalVolumeCm3: Math.round(itemVolume),
        finalWeightG: Math.round(itemWeight),
        packBehavior: item.pack_behavior,
        source: item.source_type,
      };
    });
  
    const weightKg = Number((totalWeightG / 1000).toFixed(2));
    const usedCapacityPercent =
    totalAvailableVolumeCm3 > 0
      ? Math.round((totalVolumeCm3 / totalAvailableVolumeCm3) * 100)
      : 0;
      
    const remainingVolumeCm3 = totalAvailableVolumeCm3 - totalVolumeCm3;
    const volumeFits = totalVolumeCm3 <= totalAvailableVolumeCm3;
    const weightFits = totalWeightG <= totalAvailableWeightG;
    const overallFits = volumeFits && weightFits;
  
    const totals = {
      totalVolumeCm3,
      totalWeightG,
      weightKg,
      usedCapacityPercent,
      remainingVolumeCm3,
      volumeFits,
      weightFits,
      overallFits,
      totalAvailableVolumeCm3,
      totalAllowedWeightG,
    };
  
    const sortedPackingItems = [...detailedItems].sort((a, b) => {
      const priorityDiff = getPackingPriority(a) - getPackingPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      return b.finalVolumeCm3 - a.finalVolumeCm3;
    });
  
    const packingOrder = sortedPackingItems.map((item, index) => ({
      step: index + 1,
      tripItemId: item.tripItemId,
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity,
      packBehavior: item.packBehavior,
      finalVolumeCm3: item.finalVolumeCm3,
      finalWeightG: item.finalWeightG,
      zone: getPackingZone(item),
      instruction: getPackingInstruction(item),
    }));
  
    const suitcaseLayout = {
      bottomLayer: [],
      leftSide: [],
      rightSide: [],
      middleLayer: [],
      cornersAndGaps: [],
    };
  
    sortedPackingItems.forEach((item, index) => {
      const section = getLayoutSection(item, index);
      suitcaseLayout[section].push({
        tripItemId: item.tripItemId,
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        packBehavior: item.packBehavior,
        finalVolumeCm3: item.finalVolumeCm3,
      });
    });
  
    const advice = getSmartAdvice(detailedItems, totals, suitcase);

    const smartAdjustments = buildAdjustmentSuggestions(
      detailedItems,
      totals
    );
  
    return {
      totals,
      items: detailedItems,
      packingOrder,
      suitcaseLayout,
      advice,
      smartAdjustments,
      suitcasesSummary: suitcases.map((bag) => ({
        id: bag.id,
        name: bag.name,
        bagRole: bag.bag_role,
        isPrimary: !!bag.is_primary,
        volumeCm3: Number(bag.volume_cm3),
        maxWeightKg: Number(bag.max_weight_kg),
      })),
    };
  };
  
  module.exports = { calculateTripResult };