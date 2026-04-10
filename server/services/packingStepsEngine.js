function normalizeText(value = "") {
    return String(value || "").toLowerCase();
  }
  
  function getFoldType(item) {
    const category = normalizeText(item.category);
    const name = normalizeText(item.name);
  
    if (item.foldType) return item.foldType;
    if (item.fold_type) return item.fold_type;
    if (item.stepType === "wear_on_travel_day") return "wear_directly";
      
    if (category === "documents" || category === "tech" || category === "toiletries") {
      return "no_fold";
    }
  
    if (name.includes("underwear") || name.includes("socks")) {
      return "roll_fold";
    }
  
    if (
      name.includes("t-shirt") ||
      name.includes("shirt") ||
      name.includes("pants") ||
      name.includes("shorts") ||
      name.includes("hoodie") ||
      name.includes("sleepwear") ||
      category === "clothing"
    ) {
      return "flat_fold";
    }
  
    return "no_fold";
  }
  
  function getTargetZone(item, bagType) {
    const category = normalizeText(item.category);
    const stepType = item.stepType;
  
    if (stepType === "wear_on_travel_day") return "travel_day";
    if (stepType === "keep_accessible") return "quick_access";
  
    if (bagType === "personal_item") {
      if (category === "documents" || category === "tech") return "quick_access";
      return "main_compartment";
    }
  
    if (bagType === "carry_on") {
      if (category === "toiletries") return "top_layer";
      if (category === "shoes") return "bottom_layer";
      if (category === "documents" || category === "tech") return "top_layer";
      return "middle_layer";
    }
  
    if (bagType === "checked_medium" || bagType === "checked_large") {
      if (category === "shoes") return "bottom_layer";
      if (category === "toiletries") return "top_layer";
      return "middle_layer";
    }
  
    return "main_compartment";
  }
  
  function getStepType(item, bagType = "") {
    const travelDayMode = normalizeText(item.travelDayMode || item.travel_day_mode);
    const category = normalizeText(item.category);
  
    if (travelDayMode === "wear_on_travel_day") return "wear_on_travel_day";
    if (travelDayMode === "keep_accessible") return "keep_accessible";
  
    if (category === "clothing") return "fold_and_place";
    return "place_directly";
  }
  
  function buildInstruction(step) {
    const qtyText = step.quantity > 1 ? `${step.quantity} ${step.itemName}s` : step.itemName;
  
    if (step.stepType === "wear_on_travel_day") {
      return `Wear ${qtyText} on the travel day instead of packing it.`;
    }
  
    if (step.stepType === "keep_accessible") {
      return `Place ${qtyText} in the ${step.targetZone.replace(/_/g, " ")} section of ${step.targetBagName}.`;
    }
  
    if (step.stepType === "fold_and_place") {
      return `Fold ${qtyText} using a ${step.foldType.replace(/_/g, " ")} and place it in the ${step.targetZone.replace(/_/g, " ")} of ${step.targetBagName}.`;
    }
  
    return `Place ${qtyText} in the ${step.targetZone.replace(/_/g, " ")} of ${step.targetBagName}.`;
  }
  
  function getOrderPriority(item, bagType = "") {
    const category = normalizeText(item.category);
    const travelDayMode = normalizeText(item.travelDayMode || item.travel_day_mode);
  
    if (travelDayMode === "wear_on_travel_day") return 900;
    if (travelDayMode === "keep_accessible") return 700;
  
    if (category === "shoes") return 100;
    if (category === "clothing") return 200;
    if (category === "toiletries") return 400;
    if (category === "tech") return 500;
    if (category === "documents") return 600;
    if (category === "accessories") return 650;
  
    if (bagType === "personal_item") return 550;
  
    return 500;
  }
  
  function buildPackingSteps({ bagResults = [], travelDay = {} }) {
    const rawSteps = [];
  
    bagResults.forEach((bag) => {
      const bagType = normalizeText(bag.bagType);
      const bagName = bag.bagName;
  
      (bag.items || []).forEach((item) => {
        const stepType = getStepType(item, bagType);
        const foldType = getFoldType({ ...item, stepType });
        const targetZone = getTargetZone({ ...item, stepType }, bagType);
  
        rawSteps.push({
          sortPriority: getOrderPriority(item, bagType),
          stepType,
          itemId: item.itemId || item.id || null,
          itemName: item.name || "Item",
          quantity: Number(item.quantity || 1),
          foldType,
          targetBagId: bag.bagId,
          targetBagName: bagName,
          targetZone,
        });
      });
    });
  
    (travelDay.wornOnTravelDay || []).forEach((item) => {
      rawSteps.push({
        sortPriority: 1000,
        stepType: "wear_on_travel_day",
        itemId: item.id || null,
        itemName: item.name || "Item",
        quantity: Number(item.quantity || 1),
        foldType: "wear_directly",
        targetBagId: null,
        targetBagName: null,
        targetZone: "travel_day",
      });
    });
  
    (travelDay.keepAccessible || []).forEach((item) => {
      rawSteps.push({
        sortPriority: 750,
        stepType: "keep_accessible",
        itemId: item.id || null,
        itemName: item.name || "Item",
        quantity: Number(item.quantity || 1),
        foldType: "no_fold",
        targetBagId: null,
        targetBagName: "Accessible Bag",
        targetZone: "quick_access",
      });
    });
  
    const sorted = rawSteps.sort((a, b) => a.sortPriority - b.sortPriority);
  
    return sorted.map((step, index) => {
      const finalStep = {
        stepOrder: index + 1,
        stepType: step.stepType,
        itemId: step.itemId,
        itemName: step.itemName,
        quantity: step.quantity,
        foldType: step.foldType,
        targetBagId: step.targetBagId,
        targetBagName: step.targetBagName,
        targetZone: step.targetZone,
      };
  
      return {
        ...finalStep,
        instructionText: buildInstruction(finalStep),
      };
    });
  }
  
  module.exports = {
    buildPackingSteps,
  };