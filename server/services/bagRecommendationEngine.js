function checkBagCompatibility(bag, airlineRules = []) {
    const rule = airlineRules.find((r) => r.bag_type === bag.bag_type && Number(r.is_allowed) === 1);
  
    if (!rule) {
      return {
        compatible: false,
        reason: "This bag type is not allowed for the selected airline.",
      };
    }
  
    const dimensionsOk =
      (rule.max_length_cm == null || Number(bag.length_cm) <= Number(rule.max_length_cm)) &&
      (rule.max_width_cm == null || Number(bag.width_cm) <= Number(rule.max_width_cm)) &&
      (rule.max_height_cm == null || Number(bag.height_cm) <= Number(rule.max_height_cm));
  
    const weightOk =
      rule.max_weight_kg == null ||
      bag.max_weight_kg == null ||
      Number(bag.max_weight_kg) <= Number(rule.max_weight_kg);
  
    if (!dimensionsOk) {
      return {
        compatible: false,
        reason: "This bag exceeds the airline size limit for this category.",
      };
    }
  
    if (!weightOk) {
      return {
        compatible: false,
        reason: "This bag exceeds the airline weight limit for this category.",
      };
    }
  
    return {
      compatible: true,
      reason: "Compatible with the selected airline.",
    };
  }
  
  function scoreBagForTrip(trip, bag, airlineRules = []) {
    let score = 0;
  
    const duration = Number(trip.duration_days || 0);
    const travelers = Number(trip.traveler_count || 1);
    const tripType = (trip.trip_type || trip.travel_type || "casual").toLowerCase();
    const packingMode = (trip.packing_mode || "balanced").toLowerCase();
  
    const compatibility = checkBagCompatibility(bag, airlineRules);
    if (!compatibility.compatible) {
      return {
        score: 0,
        compatible: false,
        reason: compatibility.reason,
      };
    }
  
    score += 40;
  
    if (duration <= 2) {
      if (bag.bag_type === "personal_item") score += 20;
      if (bag.bag_type === "carry_on") score += 15;
    } else if (duration <= 5) {
      if (bag.bag_type === "carry_on") score += 20;
      if (bag.bag_type === "personal_item") score += 10;
      if (bag.bag_type === "checked_medium") score += 12;
    } else {
      if (bag.bag_type === "checked_medium") score += 20;
      if (bag.bag_type === "checked_large") score += 16;
      if (bag.bag_type === "carry_on") score += 8;
    }
  
    if (travelers > 1) {
      if (bag.bag_type === "checked_medium" || bag.bag_type === "checked_large") {
        score += 10;
      }
    }
  
    if (packingMode === "light") {
      if (bag.bag_type === "personal_item") score += 15;
      if (bag.bag_type === "carry_on") score += 12;
    }
  
    if (packingMode === "balanced") {
      if (bag.bag_type === "carry_on") score += 15;
      if (bag.bag_type === "personal_item") score += 8;
      if (bag.bag_type === "checked_medium") score += 8;
    }
  
    if (packingMode === "maximum_prepared") {
      if (bag.bag_type === "checked_medium") score += 15;
      if (bag.bag_type === "checked_large") score += 12;
    }
  
    if (packingMode === "carry_on_only") {
      if (bag.bag_type === "carry_on") score += 20;
      if (bag.bag_type === "personal_item") score += 10;
    }
  
    if (tripType === "business" && bag.bag_type === "carry_on") {
      score += 8;
    }
  
    if (tripType === "winter" && (bag.bag_type === "checked_medium" || bag.bag_type === "checked_large")) {
      score += 10;
    }
  
    return {
      score,
      compatible: true,
      reason: compatibility.reason,
    };
  }
  
  function buildRecommendedCombos(trip, compatibleBags = []) {
    const personal = compatibleBags.find((b) => b.bag_type === "personal_item");
    const carryOn = compatibleBags.find((b) => b.bag_type === "carry_on");
    const checkedMedium = compatibleBags.find((b) => b.bag_type === "checked_medium");
  
    const combos = [];
  
    if (carryOn && personal) {
      combos.push({
        label: "Best Balanced Combo",
        score: 96,
        bags: [carryOn, personal],
        reason: "Balanced capacity with strong airline compatibility.",
      });
    }
  
    if (checkedMedium && personal) {
      combos.push({
        label: "Extended Capacity Combo",
        score: 90,
        bags: [checkedMedium, personal],
        reason: "Gives more room for longer or heavier trips.",
      });
    }
  
    if (carryOn) {
      combos.push({
        label: "Carry-On Focus",
        score: 84,
        bags: [carryOn],
        reason: "Simple and efficient single-bag setup.",
      });
    }
  
    return combos;
  }
  
  function buildBagRecommendations(trip, bags = [], airlineRules = []) {
    const scored = bags.map((bag) => {
      const result = scoreBagForTrip(trip, bag, airlineRules);
  
      return {
        ...bag,
        score: result.score,
        compatible: result.compatible,
        recommendation_reason: result.reason,
      };
    });
  
    const compatibleBags = scored
      .filter((bag) => bag.compatible)
      .sort((a, b) => b.score - a.score);
  
    const recommendedBags = compatibleBags.slice(0, 3).map((bag, index) => ({
      ...bag,
      recommended: index < 2,
    }));
  
    const warnings = [];
  
    if (!compatibleBags.some((b) => b.bag_type === "carry_on")) {
      warnings.push("No carry-on bag currently matches the selected airline rules.");
    }
  
    if (
      Number(trip.duration_days || 0) >= 5 &&
      compatibleBags.every((b) => b.bag_type === "personal_item")
    ) {
      warnings.push("Personal-item-only options may be too small for this trip.");
    }
  
    return {
      recommendedBags,
      compatibleBags,
      recommendedCombos: buildRecommendedCombos(trip, compatibleBags),
      warnings,
    };
  }
  
  module.exports = {
    buildBagRecommendations,
  };