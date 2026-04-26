const axios = require("axios");

function normalizeBagForSolver(bag = {}) {
  const outerLength = Number(bag.length_cm || 55);
  const outerWidth = Number(bag.width_cm || 35);
  const outerHeight = Number(bag.height_cm || 23);

  const innerWidth = Math.max(12, outerWidth - 2);
  const innerHeight = Math.max(12, outerLength - 4);
  const innerDepth = Math.max(10, outerHeight - 2);

  return {
    id: Number(bag.id),
    name: bag.name || `Bag #${bag.id}`,
    width_cm: innerWidth,
    height_cm: innerHeight,
    depth_cm: innerDepth,
    max_weight_g: Number(bag.max_weight_kg || 0) * 1000,
  };
}

function buildItemName(item) {
  return item.custom_name || item.base_item_name || item.name || "Item";
}

function normalizeItemCategory(category = "") {
  return String(category || "").trim().toLowerCase() || "misc";
}

function normalizeItemsForSolver(tripItems = []) {
  return tripItems.map((item) => {
    const dims = item.resolved_dimensions_cm || {};

    return {
      id: Number(item.id),
      name: buildItemName(item),
      category: normalizeItemCategory(item.category),
      width_cm: Number(dims.w || 0),
      height_cm: Number(dims.h || 0),
      depth_cm: Number(dims.d || 0),
      weight_g: Number(item.effective_weight_g || item.base_weight_g || 0),
      quantity: Math.max(1, Number(item.quantity || 1)),
      compressibility_score: Number(
        item.resolved_compressibility_score || item.compressibility_score || 0
      ),
      rigid:
        String(item.resolved_material_type || item.material_type || "").toLowerCase() === "rigid",
    };
  });
}

function buildSceneRotation(rotation = "flat") {
  switch (rotation) {
    case "flat":
      return { x: 0, y: 0, z: 0 };
    case "flat_rotated":
      return { x: 0, y: 90, z: 0 };
    case "side":
      return { x: 90, y: 0, z: 0 };
    case "side_rotated":
      return { x: 90, y: 90, z: 0 };
    case "upright":
      return { x: 0, y: 0, z: 90 };
    case "upright_rotated":
      return { x: 0, y: 90, z: 90 };
    default:
      return { x: 0, y: 0, z: 0 };
  }
}

function buildRenderHint(item = {}) {
  const category = normalizeItemCategory(item.category);

  const categoryMap = {
    toiletries: { shape: "rounded_box", colorToken: "toiletries", icon: "pouch" },
    shoes: { shape: "shoe_box", colorToken: "shoes", icon: "shoe" },
    documents: { shape: "flat_document", colorToken: "documents", icon: "document" },
    tech: { shape: "compact_box", colorToken: "tech", icon: "tech" },
    underwear: { shape: "soft_roll", colorToken: "underwear", icon: "roll" },
    accessories: { shape: "small_box", colorToken: "accessories", icon: "accessory" },
    bottoms: { shape: "folded_cloth", colorToken: "clothing", icon: "pants" },
    outerwear: { shape: "folded_cloth", colorToken: "clothing", icon: "hoodie" },
    clothing: { shape: "folded_cloth", colorToken: "clothing", icon: "shirt" },
  };

  return (
    categoryMap[category] || {
      shape: "rounded_box",
      colorToken: "misc",
      icon: "item",
    }
  );
}

function mapSolverPackedUnitsToScene({
  packedUnits = [],
  tripItems = [],
  bag,
}) {
  const tripItemMap = new Map(tripItems.map((item) => [Number(item.id), item]));

  const items = packedUnits.map((unit, index) => {
    const tripItem = tripItemMap.get(Number(unit.item_id)) || null;

    return {
      tripItemId: Number(unit.item_id),
      sceneItemId: `${unit.item_id}-${unit.unit_index}`,
      itemId: tripItem?.item_id || null,
      name: unit.item_name || buildItemName(tripItem || {}),
      category: normalizeItemCategory(tripItem?.category),
      quantity: 1,
      unitIndex: Number(unit.unit_index),
      massG: Number(tripItem?.effective_weight_g || tripItem?.base_weight_g || 0),
      zoneKey: "solver_placed",
      positionCm: {
        x: Number(unit.x_cm || 0),
        y: Number(unit.y_cm || 0),
        z: Number(unit.z_cm || 0),
      },
      sizeCm: {
        w: Number(unit.width_cm || 0),
        h: Number(unit.height_cm || 0),
        d: Number(unit.depth_cm || 0),
      },
      rotationDeg: buildSceneRotation(unit.rotation),
      renderHint: buildRenderHint(tripItem || {}),
      stepNumber: index + 1,
      bagId: Number(bag.id),
      materialType: tripItem?.resolved_material_type || tripItem?.material_type || "semi_soft",
      rigidityScore: Number(tripItem?.resolved_rigidity_score || tripItem?.rigidity_score || 0),
      stackabilityScore: Number(
        tripItem?.resolved_stackability_score || tripItem?.stackability_score || 0
      ),
      canBeStackBase: false,
      supportType: Number(unit.y_cm || 0) === 0 ? "floor" : "stack",
      supportCoverageRatio: 1,
      compressionAppliedRatio: 1,
      placementScore: 100,
      placementScoreBreakdown: {
        source: "python_solver",
      },
      placementIssues: [],
      placementSuggestions: [],
    };
  });

  const steps = items.map((item, index) => ({
    stepNumber: index + 1,
    tripItemId: item.tripItemId,
    sceneItemId: item.sceneItemId,
    bagId: Number(bag.id),
    instruction: `Place ${item.name} into ${bag.name}.`,
    highlightItemIds: [item.sceneItemId],
    cameraHint: null,
    placementScore: item.placementScore,
  }));

  return { items, steps };
}

function buildSimulationSceneFromSolver({
  tripId,
  bag,
  packedUnits = [],
  unpackedUnits = [],
  tripItems = [],
}) {
  const normalizedBag = normalizeBagForSolver(bag);

  const { items, steps } = mapSolverPackedUnitsToScene({
    packedUnits,
    tripItems,
    bag,
  });

  const overflow = unpackedUnits.map((unit) => ({
    tripItemId: Number(unit.item_id),
    sceneItemId: `${unit.item_id}-${unit.unit_index}`,
    itemId: null,
    name: unit.item_name || "Item",
    category: "misc",
    quantity: 1,
    unitIndex: Number(unit.unit_index),
    reason: "Item did not fit in solver result.",
  }));

  return {
    sceneVersion: 100,
    tripId: Number(tripId),
    generatedAt: new Date().toISOString(),
    bags: [
      {
        bag: {
          bagId: Number(bag.id),
          name: bag.name || `Bag #${bag.id}`,
          type: bag.bag_role || bag.bag_type || "main",
          dimensionsCm: {
            length: Number(bag.length_cm || 0),
            width: Number(bag.width_cm || 0),
            height: Number(bag.height_cm || 0),
          },
          innerDimensionsCm: {
            width: normalizedBag.width_cm,
            height: normalizedBag.height_cm,
            depth: normalizedBag.depth_cm,
          },
          capacityCm3:
            Number(normalizedBag.width_cm) *
            Number(normalizedBag.height_cm) *
            Number(normalizedBag.depth_cm),
          maxWeightG: Number(bag.max_weight_kg || 0) * 1000,
        },
        zones: [],
        items,
        summary: {
          bagId: Number(bag.id),
          bagName: bag.name || `Bag #${bag.id}`,
          bagType: bag.bag_role || bag.bag_type || "main",
          usedVolumeCm3: items.reduce(
            (sum, item) =>
              sum +
              Number(item.sizeCm.w || 0) *
                Number(item.sizeCm.h || 0) *
                Number(item.sizeCm.d || 0),
            0
          ),
          availableVolumeCm3:
            Number(normalizedBag.width_cm) *
            Number(normalizedBag.height_cm) *
            Number(normalizedBag.depth_cm),
          usedWeightG: items.reduce((sum, item) => sum + Number(item.massG || 0), 0),
          availableWeightG: Number(bag.max_weight_kg || 0) * 1000,
        },
      },
    ],
    primaryBag: {
      bag: {
        bagId: Number(bag.id),
        name: bag.name || `Bag #${bag.id}`,
        type: bag.bag_role || bag.bag_type || "main",
        dimensionsCm: {
          length: Number(bag.length_cm || 0),
          width: Number(bag.width_cm || 0),
          height: Number(bag.height_cm || 0),
        },
        innerDimensionsCm: {
          width: normalizedBag.width_cm,
          height: normalizedBag.height_cm,
          depth: normalizedBag.depth_cm,
        },
        capacityCm3:
          Number(normalizedBag.width_cm) *
          Number(normalizedBag.height_cm) *
          Number(normalizedBag.depth_cm),
        maxWeightG: Number(bag.max_weight_kg || 0) * 1000,
      },
      zones: [],
      items,
      summary: {
        bagId: Number(bag.id),
        bagName: bag.name || `Bag #${bag.id}`,
        bagType: bag.bag_role || bag.bag_type || "main",
      },
    },
    items,
    steps,
    summary: {
      overallFits: overflow.length === 0,
      overflowItemCount: overflow.length,
      placedItemCount: items.length,
      bagCount: 1,
    },
    warnings:
      overflow.length > 0
        ? [`${overflow.length} item(s) could not be packed by solver.`]
        : [],
    overflow,
  };
}

async function solvePackingWithPython({
  tripId,
  bag,
  tripItems,
}) {
  const solverUrl = process.env.PYTHON_PACKING_SOLVER_URL;
  if (!solverUrl) {
    throw new Error("PYTHON_PACKING_SOLVER_URL is missing.");
  }

  const payload = {
    bag: normalizeBagForSolver(bag),
    items: normalizeItemsForSolver(tripItems),
  };

  const response = await axios.post(`${solverUrl}/solve`, payload, {
    timeout: 30000,
  });

  const data = response?.data;
  if (!data?.success) {
    throw new Error("Python solver did not return success=true.");
  }

  return {
    solverRaw: data,
    simulationScene: buildSimulationSceneFromSolver({
      tripId,
      bag,
      packedUnits: data.packed_units || [],
      unpackedUnits: data.unpacked_units || [],
      tripItems,
    }),
  };
}

module.exports = {
  solvePackingWithPython,
};