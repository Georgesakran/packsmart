const { buildBagZones } = require("./packingZones");
const {
  makeBox,
  boxesOverlap,
  fitsInside,
  getCenter,
} = require("./packingGeometry");
const { resolveOrientations } = require("./packingOrientationResolver");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nearlyEqual(a, b, tolerance = 0.01) {
  return Math.abs(Number(a || 0) - Number(b || 0)) <= tolerance;
}

function normalizeInnerBagDimensionsCm(bag) {
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

function buildRenderHint(item) {
  const category = String(item.category || "misc").toLowerCase();

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

function isSoftCategory(category = "") {
  const normalized = String(category).toLowerCase();
  return [
    "underwear",
    "accessories",
    "clothing",
    "bottoms",
    "outerwear",
  ].includes(normalized);
}

function isHighlyCompressible(category = "") {
  const normalized = String(category).toLowerCase();
  return ["underwear", "accessories", "clothing"].includes(normalized);
}

function isStackFriendly(category = "") {
  const normalized = String(category).toLowerCase();
  return [
    "underwear",
    "accessories",
    "clothing",
    "bottoms",
    "outerwear",
    "documents",
  ].includes(normalized);
}

function isRigidBase(category = "") {
  const normalized = String(category).toLowerCase();
  return ["shoes", "toiletries", "tech"].includes(normalized);
}

function getPreferredZones(item) {
  const category = String(item.category || "").toLowerCase();
  const travelDayMode = String(item.travel_day_mode || "normal").toLowerCase();

  if (travelDayMode === "keep_accessible") {
    return ["quick_access", "top_layer", "side_channel_left", "side_channel_right", "middle_core"];
  }

  if (category === "documents") {
    return ["quick_access", "top_layer"];
  }

  if (category === "tech") {
    return ["quick_access", "top_layer", "middle_core"];
  }

  if (category === "accessories") {
    return ["quick_access", "top_layer", "side_channel_left", "side_channel_right"];
  }

  if (category === "toiletries") {
    return ["top_layer", "middle_core", "bottom_base"];
  }

  if (category === "shoes") {
    return ["bottom_base", "middle_core"];
  }

  if (category === "underwear") {
    return ["side_channel_left", "side_channel_right", "top_layer", "middle_core"];
  }

  if (category === "bottoms") {
    return ["middle_core", "bottom_base"];
  }

  if (category === "outerwear") {
    return ["middle_core", "top_layer", "bottom_base"];
  }

  if (category === "clothing") {
    return ["middle_core", "top_layer", "bottom_base"];
  }

  return ["middle_core", "bottom_base", "top_layer"];
}

function getBagPriority(bag) {
  const role = String(bag.bag_role || bag.bag_type || "").toLowerCase();

  if (role === "personal" || role === "personal_item") return 1;
  if (role === "carry_on") return 2;
  if (role === "main") return 3;
  return 4;
}

function itemPriority(item) {
  const category = String(item.category || "").toLowerCase();
  const travelDayMode = String(item.travel_day_mode || "normal").toLowerCase();
  const volume = Number(item.effective_volume_cm3 || item.base_volume_cm3 || 0);
  const weight = Number(item.effective_weight_g || item.base_weight_g || 0);

  let score = volume + Math.round(weight * 0.7);

  if (travelDayMode === "keep_accessible") score -= 5000;
  if (category === "documents") score -= 4200;
  if (category === "tech") score -= 3000;
  if (category === "accessories") score -= 1800;
  if (category === "underwear") score -= 1200;
  if (category === "shoes") score += 5000;
  if (category === "outerwear") score += 2600;
  if (category === "bottoms") score += 1800;
  if (category === "toiletries") score += 900;

  return score;
}

function estimateItemDimensionsCm(item) {
  const volume = Number(item.effective_volume_cm3 || item.base_volume_cm3 || 0);
  const category = String(item.category || "").toLowerCase();

  if (category === "documents") {
    return { w: 12, h: 2, d: 9 };
  }

  if (category === "tech") {
    return { w: 13, h: 4, d: 9 };
  }

  if (category === "toiletries") {
    return { w: 16, h: 6, d: 10 };
  }

  if (category === "shoes") {
    return { w: 18, h: 11, d: 13 };
  }

  if (category === "underwear") {
    return { w: 7, h: 4, d: 6 };
  }

  if (category === "accessories") {
    return { w: 9, h: 4, d: 7 };
  }

  if (category === "bottoms") {
    return { w: 18, h: 4, d: 12 };
  }

  if (category === "outerwear") {
    return { w: 19, h: 7, d: 13 };
  }

  if (category === "clothing") {
    return { w: 16, h: 4, d: 11 };
  }

  const cube = Math.max(4, Math.cbrt(Math.max(64, volume)));
  return {
    w: Math.max(6, Math.round(cube * 1.2)),
    h: Math.max(3, Math.round(cube * 0.7)),
    d: Math.max(6, Math.round(cube * 1.0)),
  };
}

function normalizeSceneItems(tripItems = []) {
  return tripItems.map((item) => {
    const weightG = Number(item.effective_weight_g || item.base_weight_g || 0);

    return {
      tripItemId: item.id,
      itemId: item.item_id || null,
      name: item.custom_name || item.base_item_name || "Item",
      category: item.category || "misc",
      quantity: Number(item.quantity || 1),
      massG: weightG,
      dimensionsCm: estimateItemDimensionsCm(item),
      packing_status: item.packing_status || "pending",
      travel_day_mode: item.travel_day_mode || "normal",
      renderHint: buildRenderHint(item),
    };
  });
}

function applyCompressionRules(item, orientation, zoneKey, supportType = "floor") {
  const category = String(item.category || "").toLowerCase();
  const base = orientation.sizeCm;

  let w = Number(base.w || 0);
  let h = Number(base.h || 0);
  let d = Number(base.d || 0);

  if (isHighlyCompressible(category)) {
    h *= supportType === "stack" ? 0.7 : 0.82;
    d *= zoneKey === "side_channel_left" || zoneKey === "side_channel_right" ? 0.82 : 0.9;
  } else if (isSoftCategory(category)) {
    h *= supportType === "stack" ? 0.78 : 0.88;
    d *= 0.94;
  }

  if (category === "underwear") {
    w *= 0.9;
    d *= 0.82;
    h *= 0.76;
  }

  if (category === "documents") {
    h *= 0.9;
  }

  return {
    w: Math.max(2, Math.round(w * 10) / 10),
    h: Math.max(1, Math.round(h * 10) / 10),
    d: Math.max(2, Math.round(d * 10) / 10),
  };
}

function getZonePlacementCandidates(zone, sizeCm, item) {
  const b = zone.boundsCm;

  const minX = b.x;
  const maxX = b.x + b.w - sizeCm.w;
  const minY = b.y;
  const maxY = b.y + b.h - sizeCm.h;
  const minZ = b.z;
  const maxZ = b.z + b.d - sizeCm.d;

  const centerX = b.x + (b.w - sizeCm.w) / 2;
  const centerY = b.y + (b.h - sizeCm.h) / 2;
  const centerZ = b.z + (b.d - sizeCm.d) / 2;

  const category = String(item.category || "").toLowerCase();
  const candidates = [];

  if (zone.zoneKey === "bottom_base") {
    candidates.push(
      { x: minX, y: minY, z: minZ },
      { x: maxX, y: minY, z: minZ },
      { x: minX, y: minY, z: maxZ },
      { x: maxX, y: minY, z: maxZ },
      { x: centerX, y: minY, z: minZ },
      { x: centerX, y: minY, z: centerZ }
    );
  } else if (zone.zoneKey === "quick_access") {
    candidates.push(
      { x: minX, y: minY, z: minZ },
      { x: centerX, y: minY, z: minZ },
      { x: maxX, y: minY, z: minZ },
      { x: minX, y: minY, z: centerZ }
    );
  } else if (
    zone.zoneKey === "side_channel_left" ||
    zone.zoneKey === "side_channel_right"
  ) {
    candidates.push(
      { x: minX, y: minY, z: minZ },
      { x: minX, y: centerY, z: minZ },
      { x: minX, y: minY, z: centerZ }
    );
  } else {
    candidates.push(
      { x: minX, y: minY, z: minZ },
      { x: centerX, y: minY, z: minZ },
      { x: maxX, y: minY, z: minZ },
      { x: minX, y: minY, z: centerZ },
      { x: centerX, y: minY, z: centerZ },
      { x: maxX, y: minY, z: centerZ }
    );
  }

  if (category === "documents" || category === "tech") {
    candidates.unshift({ x: minX, y: minY, z: minZ });
  }

  return dedupeCandidates(
    candidates.filter(
      (c) =>
        c.x >= minX &&
        c.x <= maxX &&
        c.y >= minY &&
        c.y <= maxY &&
        c.z >= minZ &&
        c.z <= maxZ
    )
  );
}

function dedupeCandidates(candidates = []) {
  const seen = new Set();
  return candidates.filter((c) => {
    const key = `${Math.round(c.x * 10)}-${Math.round(c.y * 10)}-${Math.round(c.z * 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rangesOverlap(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function getOverlapLength(startA, endA, startB, endB) {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

function getSupportCandidates(zone, placedItems, item, sizeCm) {
  const supportCandidates = [{ y: zone.boundsCm.y, supportType: "floor", supportItems: [] }];

  if (!isStackFriendly(item.category)) {
    return supportCandidates;
  }

  const zonePlaced = placedItems.filter((placed) => placed.zoneKey === zone.zoneKey);

  for (const placed of zonePlaced) {
    const topY = Number(placed.positionCm.y || 0) + Number(placed.sizeCm.h || 0);

    if (topY + sizeCm.h > zone.boundsCm.y + zone.boundsCm.h) continue;

    const placedCategory = String(placed.category || "").toLowerCase();

    if (
      isRigidBase(placedCategory) ||
      isSoftCategory(placedCategory) ||
      placedCategory === "documents"
    ) {
      supportCandidates.push({
        y: topY,
        supportType: "stack",
        supportItems: [placed],
      });
    }
  }

  return supportCandidates.sort((a, b) => a.y - b.y);
}

function hasSupportForPlacement(positionCm, sizeCm, zone, placedItems) {
  if (nearlyEqual(positionCm.y, zone.boundsCm.y)) {
    return true;
  }

  const baseY = Number(positionCm.y || 0);
  const neededCoverageRatio = 0.52;

  const supporters = placedItems.filter((placed) => {
    const topY = Number(placed.positionCm.y || 0) + Number(placed.sizeCm.h || 0);

    if (!nearlyEqual(topY, baseY, 0.1)) return false;

    const xOverlap = getOverlapLength(
      positionCm.x,
      positionCm.x + sizeCm.w,
      placed.positionCm.x,
      placed.positionCm.x + placed.sizeCm.w
    );

    const zOverlap = getOverlapLength(
      positionCm.z,
      positionCm.z + sizeCm.d,
      placed.positionCm.z,
      placed.positionCm.z + placed.sizeCm.d
    );

    return xOverlap > 0 && zOverlap > 0;
  });

  if (!supporters.length) return false;

  const totalSupportArea = supporters.reduce((sum, placed) => {
    const xOverlap = getOverlapLength(
      positionCm.x,
      positionCm.x + sizeCm.w,
      placed.positionCm.x,
      placed.positionCm.x + placed.sizeCm.w
    );

    const zOverlap = getOverlapLength(
      positionCm.z,
      positionCm.z + sizeCm.d,
      placed.positionCm.z,
      placed.positionCm.z + placed.sizeCm.d
    );

    return sum + xOverlap * zOverlap;
  }, 0);

  const neededArea = sizeCm.w * sizeCm.d * neededCoverageRatio;
  return totalSupportArea >= neededArea;
}

function findPlacement(zone, orientation, placedItems, item) {
  const supportCandidates = getSupportCandidates(
    zone,
    placedItems,
    item,
    orientation.sizeCm
  );

  for (const supportCandidate of supportCandidates) {
    const compressedSize = applyCompressionRules(
      item,
      orientation,
      zone.zoneKey,
      supportCandidate.supportType
    );

    const bounds = zone.boundsCm;
    const maxY = bounds.y + bounds.h - compressedSize.h;
    if (supportCandidate.y > maxY) continue;

    const slotCandidates = getZonePlacementCandidates(zone, compressedSize, item).map(
      (candidate) => ({
        ...candidate,
        y: supportCandidate.y,
      })
    );

    for (const candidate of slotCandidates) {
      if (!fitsInside(bounds, candidate, compressedSize)) continue;
      if (!hasSupportForPlacement(candidate, compressedSize, zone, placedItems)) continue;

      const candidateBox = makeBox(candidate, compressedSize);
      const collision = placedItems.some((placed) =>
        boxesOverlap(candidateBox, makeBox(placed.positionCm, placed.sizeCm))
      );

      if (!collision) {
        return {
          positionCm: candidate,
          sizeCm: compressedSize,
        };
      }
    }

    const gridStepX = compressedSize.w <= 8 ? 1 : 2;
    const gridStepZ = compressedSize.d <= 8 ? 1 : 2;

    for (let z = bounds.z; z <= bounds.z + bounds.d - compressedSize.d; z += gridStepZ) {
      for (let x = bounds.x; x <= bounds.x + bounds.w - compressedSize.w; x += gridStepX) {
        const candidate = { x, y: supportCandidate.y, z };

        if (!fitsInside(bounds, candidate, compressedSize)) continue;
        if (!hasSupportForPlacement(candidate, compressedSize, zone, placedItems)) continue;

        const candidateBox = makeBox(candidate, compressedSize);
        const collision = placedItems.some((placed) =>
          boxesOverlap(candidateBox, makeBox(placed.positionCm, placed.sizeCm))
        );

        if (!collision) {
          return {
            positionCm: candidate,
            sizeCm: compressedSize,
          };
        }
      }
    }
  }

  return null;
}

function buildCameraHint(itemPlacement, bagInner) {
  const center = getCenter(itemPlacement.positionCm, itemPlacement.sizeCm);

  return {
    eye: [
      Number((bagInner.width * 0.5).toFixed(2)),
      Number((bagInner.height * 1.65).toFixed(2)),
      Number((bagInner.depth * 2.4).toFixed(2)),
    ],
    target: [
      Number(center.x.toFixed(2)),
      Number(center.y.toFixed(2)),
      Number(center.z.toFixed(2)),
    ],
  };
}

function buildBagSummary(placedItems = [], bagInner, bag) {
  const usedVolumeCm3 = placedItems.reduce((sum, item) => {
    return (
      sum +
      Number(item.sizeCm.w || 0) *
        Number(item.sizeCm.h || 0) *
        Number(item.sizeCm.d || 0)
    );
  }, 0);

  const usedWeightG = placedItems.reduce(
    (sum, item) => sum + Number(item.massG || 0),
    0
  );

  const availableVolumeCm3 =
    Number(bagInner.width || 0) *
    Number(bagInner.height || 0) *
    Number(bagInner.depth || 0);

  const availableWeightG = Number((bag.max_weight_kg || 0) * 1000);

  return {
    bagId: bag.id,
    bagName: bag.name,
    bagType: bag.bag_role || bag.bag_type || "main",
    usedVolumeCm3,
    availableVolumeCm3,
    remainingVolumeCm3: Math.max(0, availableVolumeCm3 - usedVolumeCm3),
    usedWeightG,
    availableWeightG,
    remainingWeightG: Math.max(0, availableWeightG - usedWeightG),
    volumeUsagePercent:
      availableVolumeCm3 > 0
        ? Math.round((usedVolumeCm3 / availableVolumeCm3) * 100)
        : 0,
    weightUsagePercent:
      availableWeightG > 0
        ? Math.round((usedWeightG / availableWeightG) * 100)
        : 0,
  };
}

function buildSingleBagScene({ tripId, bag, sceneItems, stepStartNumber }) {
  const inner = normalizeInnerBagDimensionsCm(bag);
  const zones = buildBagZones(inner);

  const placedItems = [];
  const overflow = [];
  const steps = [];

  let stepNumber = stepStartNumber;

  for (const item of sceneItems) {
    const preferredZones = getPreferredZones(item);
    const zoneCandidates = preferredZones
      .map((zoneKey) => zones.find((zone) => zone.zoneKey === zoneKey))
      .filter(Boolean);

    const orientations = resolveOrientations(item);
    let placed = null;

    for (const zone of zoneCandidates) {
      for (const orientation of orientations) {
        const foundPlacement = findPlacement(zone, orientation, placedItems, item);

        if (foundPlacement) {
          placed = {
            tripItemId: item.tripItemId,
            itemId: item.itemId,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            massG: item.massG,
            zoneKey: zone.zoneKey,
            positionCm: foundPlacement.positionCm,
            sizeCm: foundPlacement.sizeCm,
            rotationDeg: orientation.rotationDeg,
            renderHint: item.renderHint,
            stepNumber,
            bagId: bag.id,
          };
          break;
        }
      }
      if (placed) break;
    }

    if (!placed) {
      overflow.push(item);
      continue;
    }

    placedItems.push(placed);

    steps.push({
      stepNumber,
      tripItemId: placed.tripItemId,
      bagId: bag.id,
      instruction: `Place ${placed.name} in ${placed.zoneKey.replace(/_/g, " ")} of ${bag.name}.`,
      highlightItemIds: [placed.tripItemId],
      cameraHint: buildCameraHint(placed, inner),
    });

    stepNumber += 1;
  }

  return {
    bagScene: {
      bag: {
        bagId: bag.id,
        name: bag.name,
        type: bag.bag_role || bag.bag_type || "main",
        dimensionsCm: {
          length: Number(bag.length_cm || 0),
          width: Number(bag.width_cm || 0),
          height: Number(bag.height_cm || 0),
        },
        innerDimensionsCm: inner,
        capacityCm3: inner.width * inner.height * inner.depth,
        maxWeightG: Number((bag.max_weight_kg || 0) * 1000),
      },
      zones,
      items: placedItems,
      summary: buildBagSummary(placedItems, inner, bag),
    },
    placedItems,
    steps,
    overflow,
    nextStepNumber: stepNumber,
  };
}

function buildPackingScene({ tripId, bag, bags, tripItems }) {
  const allBags =
    Array.isArray(bags) && bags.length > 0
      ? [...bags].sort((a, b) => getBagPriority(a) - getBagPriority(b))
      : bag
      ? [bag]
      : [];

  const normalizedItems = normalizeSceneItems(tripItems).sort(
    (a, b) => itemPriority(b) - itemPriority(a)
  );

  let remainingItems = [...normalizedItems];
  const bagScenes = [];
  const allPlacedItems = [];
  const allSteps = [];
  let stepNumber = 1;

  for (const currentBag of allBags) {
    if (remainingItems.length === 0) break;

    const sceneResult = buildSingleBagScene({
      tripId,
      bag: currentBag,
      sceneItems: remainingItems,
      stepStartNumber: stepNumber,
    });

    bagScenes.push(sceneResult.bagScene);
    allPlacedItems.push(...sceneResult.placedItems);
    allSteps.push(...sceneResult.steps);

    const placedIds = new Set(
      sceneResult.placedItems.map((item) => item.tripItemId)
    );

    remainingItems = remainingItems.filter(
      (item) => !placedIds.has(item.tripItemId)
    );

    stepNumber = sceneResult.nextStepNumber;
  }

  const summary = {
    overallFits: remainingItems.length === 0,
    overflowItemCount: remainingItems.length,
    placedItemCount: allPlacedItems.length,
    bagCount: bagScenes.length,
  };

  return {
    sceneVersion: 4,
    tripId,
    generatedAt: new Date().toISOString(),
    bags: bagScenes,
    primaryBag: bagScenes[0] || null,
    items: allPlacedItems,
    steps: allSteps,
    summary,
    warnings: remainingItems.length
      ? [
          `${remainingItems.length} item${
            remainingItems.length === 1 ? "" : "s"
          } could not be placed in the available bags.`,
        ]
      : [],
    overflow: remainingItems.map((item) => ({
      tripItemId: item.tripItemId,
      itemId: item.itemId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      reason: "No collision-free placement found inside the available bags.",
    })),
  };
}

module.exports = {
  buildPackingScene,
};