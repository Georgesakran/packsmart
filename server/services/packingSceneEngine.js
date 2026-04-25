//packingSceneEngine.js
const { buildBagZones } = require("./packingZones");
const {
  makeBox,
  boxesOverlap,
  fitsInside,
  getCenter,
} = require("./packingGeometry");
const { resolveOrientations } = require("./packingOrientationResolver");
const { buildPackingItemPhysicsProfile } = require("./packingItemPhysicsProfile");
const { scorePlacementCandidate } = require("./packingPlacementScoring");


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

function getPreferredZones(item) {
  const category = String(item.category || "").toLowerCase();
  const travelDayMode = String(item.travel_day_mode || "normal").toLowerCase();
  const profile = item.physicsProfile || {};

  if (travelDayMode === "keep_accessible") {
    return ["quick_access", "top_layer", "side_channel_left", "side_channel_right", "middle_core"];
  }

  if (category === "documents") {
    return ["quick_access", "top_layer", "middle_core"];
  }

  if (category === "tech") {
    return ["quick_access", "top_layer", "middle_core"];
  }

  if (category === "accessories") {
    return ["quick_access", "side_channel_left", "side_channel_right", "top_layer", "middle_core"];
  }

  if (category === "toiletries") {
    return ["middle_core", "bottom_base", "top_layer"];
  }

  if (category === "shoes") {
    return ["bottom_base", "middle_core", "side_channel_left", "side_channel_right", "top_layer"];
  }

  if (category === "underwear") {
    return ["side_channel_left", "side_channel_right", "middle_core", "top_layer", "bottom_base"];
  }

  if (category === "bottoms") {
    return ["bottom_base", "middle_core", "top_layer"];
  }

  if (category === "outerwear") {
    return ["middle_core", "bottom_base", "top_layer"];
  }

  if (category === "clothing") {
    return ["middle_core", "bottom_base", "top_layer"];
  }

  if (profile.preferCenterZones) {
    return ["middle_core", "bottom_base", "top_layer"];
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
  if (category === "shoes") score += 9000;
  if (category === "outerwear") score += 2600;
  if (category === "bottoms") score += 1800;
  if (category === "toiletries") score += 900;

  return score;
}

function estimateItemDimensionsCm(item) {
  const resolvedDimensions = item.resolved_dimensions_cm || null;

  if (
    resolvedDimensions &&
    resolvedDimensions.w != null &&
    resolvedDimensions.h != null &&
    resolvedDimensions.d != null
  ) {
    return {
      w: Number(resolvedDimensions.w || 0),
      h: Number(resolvedDimensions.h || 0),
      d: Number(resolvedDimensions.d || 0),
    };
  }

  const volume = Number(item.effective_volume_cm3 || item.base_volume_cm3 || 0);
  const category = String(item.category || "").toLowerCase();

  if (category === "documents") return { w: 12, h: 2, d: 9 };
  if (category === "tech") return { w: 13, h: 4, d: 9 };
  if (category === "toiletries") return { w: 16, h: 6, d: 10 };
  if (category === "shoes") return { w: 18, h: 11, d: 13 };
  if (category === "underwear") return { w: 7, h: 4, d: 6 };
  if (category === "accessories") return { w: 9, h: 4, d: 7 };
  if (category === "bottoms") return { w: 18, h: 4, d: 12 };
  if (category === "outerwear") return { w: 19, h: 7, d: 13 };
  if (category === "clothing") return { w: 16, h: 4, d: 11 };

  const cube = Math.max(4, Math.cbrt(Math.max(64, volume)));
  return {
    w: Math.max(6, Math.round(cube * 1.2)),
    h: Math.max(3, Math.round(cube * 0.7)),
    d: Math.max(6, Math.round(cube * 1.0)),
  };
}

function expandSceneItemsByQuantity(baseItem, forcedQuantity = null) {
  const quantity = Math.max(
    1,
    Number(forcedQuantity != null ? forcedQuantity : baseItem.quantity || 1)
  );

  const expanded = [];

  for (let index = 0; index < quantity; index += 1) {
    expanded.push({
      ...baseItem,
      quantity: 1,
      unitIndex: index + 1,
      sceneItemId: `${baseItem.tripItemId}-${index + 1}`,
      name: quantity > 1 ? `${baseItem.name} ${index + 1}` : baseItem.name,
    });
  }

  return expanded;
}

function normalizeSceneItems(tripItems = []) {
  return tripItems.flatMap((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const totalWeightG = Number(item.effective_weight_g || item.base_weight_g || 0);
    const unitWeightG =
      quantity > 0 ? Math.max(1, totalWeightG / quantity) : Math.max(1, totalWeightG);

    const dimensionsCm = estimateItemDimensionsCm(item);

    const baseNormalized = {
      tripItemId: item.id,
      itemId: item.item_id || null,
      name: item.custom_name || item.base_item_name || "Item",
      category: item.category || "misc",
      quantity,
      massG: unitWeightG,
      dimensionsCm,
      packing_status: item.packing_status || "pending",
      travel_day_mode: item.travel_day_mode || "normal",
      resolvedProfileKey: item.resolved_profile_key || null,
      materialType: item.resolved_material_type || item.material_type || null,
      rigidityScore: Number(item.resolved_rigidity_score || item.rigidity_score || 0),
      compressibilityScore: Number(
        item.resolved_compressibility_score || item.compressibility_score || 0
      ),
      stackabilityScore: Number(
        item.resolved_stackability_score || item.stackability_score || 0
      ),
      preferredOrientations:
        item.resolved_preferred_orientations || item.preferred_orientations || [],
      allowedOrientations:
        item.resolved_allowed_orientations || item.allowed_orientations || [],
      foldStyle: item.resolved_fold_type || item.fold_type || "auto",
      renderHint:
        item.resolved_render_hint || item.render_hint || buildRenderHint(item),
    };

    const expandedItems = expandSceneItemsByQuantity(baseNormalized);

    return expandedItems.map((expandedItem) => {
      const normalizedUnit = { ...expandedItem };
      normalizedUnit.physicsProfile = buildPackingItemPhysicsProfile(normalizedUnit);
      return normalizedUnit;
    });
  });
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

function getZonePlacementCandidates(zone, sizeCm, item) {
  const b = zone.boundsCm;

  const minX = b.x;
  const maxX = b.x + b.w - sizeCm.w;
  const minY = b.y;
  const maxY = b.y + b.h - sizeCm.h;
  const minZ = b.z;
  const maxZ = b.z + b.d - sizeCm.d;

  const centerX = b.x + (b.w - sizeCm.w) / 2;
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
      { x: minX, y: minY, z: centerZ },
      { x: minX, y: maxY, z: minZ }
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

function getOverlapLength(startA, endA, startB, endB) {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB));
}

function getSupportCandidates(zone, placedItems, item, sizeCm) {
  const supportCandidates = [
    { y: zone.boundsCm.y, supportType: "floor", supportItems: [] }
  ];

  const profile = item.physicsProfile || {};
  const itemMassG = Number(item.massG || 0);
  const itemRigidity = Number(profile.rigidityScore || 0);
  const itemSupportNeed = Number(profile.supportNeedScore || 0);
  const itemArea = Number(sizeCm.w || 0) * Number(sizeCm.d || 0);

  // Heavy / rigid / fragile-support items stay grounded
  if (
    itemMassG >= 450 ||
    itemRigidity >= 70 ||
    itemSupportNeed >= 65 ||
    profile.shouldNotBeCompressed
  ) {
    return supportCandidates;
  }

  const zonePlaced = placedItems.filter((placed) => placed.zoneKey === zone.zoneKey);

  for (const placed of zonePlaced) {
    const placedTopY =
      Number(placed.positionCm.y || 0) + Number(placed.sizeCm.h || 0);

    if (placedTopY + sizeCm.h > zone.boundsCm.y + zone.boundsCm.h) continue;

    const placedSupportType = String(placed.supportType || "floor").toLowerCase();
    const placedStackability = Number(placed.stackabilityScore || 0);
    const placedRigidity = Number(placed.rigidityScore || 0);
    const placedMassG = Number(placed.massG || 0);
    const placedArea =
      Number(placed.sizeCm?.w || 0) * Number(placed.sizeCm?.d || 0);

    const areaRatio = itemArea > 0 ? placedArea / itemArea : 0;

    // only grounded bases
    if (placedSupportType !== "floor") continue;

    // must explicitly be usable as a base
    if (!placed.canBeStackBase) continue;

    // base must be stable enough
    if (placedStackability < 78) continue;

    // base cannot be too soft/light
    if (placedRigidity < 35 && placedMassG < 300) continue;

    // base footprint must be wide enough
    if (areaRatio < 0.85) continue;

    supportCandidates.push({
      y: placedTopY,
      supportType: "stack",
      supportItems: [placed],
    });
  }

  return supportCandidates.sort((a, b) => a.y - b.y);
}

function hasSupportForPlacement(positionCm, sizeCm, zone, placedItems, item = null) {
  if (nearlyEqual(positionCm.y, zone.boundsCm.y)) {
    return { supported: true, supportCoverageRatio: 1, supportingItems: [] };
  }

  const baseY = Number(positionCm.y || 0);
  const profile = item?.physicsProfile || {};
  const itemMassG = Number(item?.massG || 0);
  const itemRigidity = Number(profile.rigidityScore || 0);

  let neededCoverageRatio = 0.78;

  if (itemMassG >= 400) neededCoverageRatio = 0.84;
  if (itemMassG >= 700 || itemRigidity >= 75) neededCoverageRatio = 0.9;
  if (profile.shouldNotBeCompressed) neededCoverageRatio = Math.max(neededCoverageRatio, 0.88);

  const supporters = placedItems.filter((placed) => {
    const topY = Number(placed.positionCm.y || 0) + Number(placed.sizeCm.h || 0);
    if (!nearlyEqual(topY, baseY, 0.1)) return false;

    const placedSupportType = String(placed.supportType || "floor").toLowerCase();
    const placedStackability = Number(placed.stackabilityScore || 0);

    if (placedSupportType !== "floor") return false;
    if (!placed.canBeStackBase && placedStackability < 75) return false;

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

  if (!supporters.length) {
    return { supported: false, supportCoverageRatio: 0, supportingItems: [] };
  }

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

  const baseArea = sizeCm.w * sizeCm.d;
  const supportCoverageRatio = baseArea > 0 ? totalSupportArea / baseArea : 0;

  return {
    supported: supportCoverageRatio >= neededCoverageRatio,
    supportCoverageRatio,
    supportingItems: supporters,
  };
}

function resolveCompressionForPlacement(item, orientation, zoneKey, supportType = "floor") {
  const base = orientation.sizeCm;
  const profile = item.physicsProfile || {};
  const compressibilityScore = Number(profile.compressibilityScore || 0);
  const minRatio = Number(profile.compressionRatioMin || 1);

  let hRatio = 1;
  let dRatio = 1;
  let wRatio = 1;

  if (compressibilityScore >= 80) {
    hRatio = supportType === "stack" ? 0.55 : 0.72;
    dRatio = zoneKey.includes("side_channel") ? 0.74 : 0.84;
    wRatio = 0.9;
  } else if (compressibilityScore >= 55) {
    hRatio = supportType === "stack" ? 0.68 : 0.82;
    dRatio = zoneKey.includes("side_channel") ? 0.82 : 0.9;
    wRatio = 0.95;
  } else if (compressibilityScore >= 20) {
    hRatio = supportType === "stack" ? 0.84 : 0.93;
    dRatio = 0.95;
  }

  hRatio = Math.max(minRatio, hRatio);
  dRatio = Math.max(minRatio, dRatio);
  wRatio = Math.max(minRatio, wRatio);

  const sizeCm = {
    w: Math.max(2, Math.round(base.w * wRatio * 10) / 10),
    h: Math.max(1, Math.round(base.h * hRatio * 10) / 10),
    d: Math.max(2, Math.round(base.d * dRatio * 10) / 10),
  };

  const compressionAppliedRatio = Math.min(
    sizeCm.w / Math.max(1, base.w),
    sizeCm.h / Math.max(1, base.h),
    sizeCm.d / Math.max(1, base.d)
  );

  return {
    sizeCm,
    compressionAppliedRatio,
  };
}

function findBestPlacement(zone, orientation, placedItems, item, bagInner) {
  const supportCandidates = getSupportCandidates(
    zone,
    placedItems,
    item,
    orientation.sizeCm
  );

  let bestCandidate = null;

  for (const supportCandidate of supportCandidates) {
    const { sizeCm, compressionAppliedRatio } = resolveCompressionForPlacement(
      item,
      orientation,
      zone.zoneKey,
      supportCandidate.supportType
    );

    const bounds = zone.boundsCm;
    const maxY = bounds.y + bounds.h - sizeCm.h;
    if (supportCandidate.y > maxY) continue;

    const slotCandidates = getZonePlacementCandidates(zone, sizeCm, item).map((candidate) => ({
      ...candidate,
      y: supportCandidate.y,
    }));

    const denseStepX = sizeCm.w <= 8 ? 1 : 2;
    const denseStepZ = sizeCm.d <= 8 ? 1 : 2;

    for (let z = bounds.z; z <= bounds.z + bounds.d - sizeCm.d; z += denseStepZ) {
      for (let x = bounds.x; x <= bounds.x + bounds.w - sizeCm.w; x += denseStepX) {
        slotCandidates.push({ x, y: supportCandidate.y, z });
      }
    }

    for (const candidate of dedupeCandidates(slotCandidates)) {
      if (!fitsInside(bounds, candidate, sizeCm)) continue;

      const supportCheck = hasSupportForPlacement(
        candidate,
        sizeCm,
        zone,
        placedItems,
        item
      );
      if (!supportCheck.supported) continue;

      const candidateBox = makeBox(candidate, sizeCm);
      const collision = placedItems.some((placed) =>
        boxesOverlap(candidateBox, makeBox(placed.positionCm, placed.sizeCm))
      );
      if (collision) continue;

      const scored = scorePlacementCandidate({
        item,
        profile: item.physicsProfile,
        zone,
        positionCm: candidate,
        sizeCm,
        orientation,
        supportType: supportCandidate.supportType,
        supportCoverageRatio: supportCheck.supportCoverageRatio,
        supportingItems: supportCheck.supportingItems,
        compressionAppliedRatio,
        bagInner,
      });

      const floorBonus = supportCandidate.supportType === "floor" ? 8 : 0;
      const lowPlacementBonus = Math.max(0, 12 - candidate.y * 2.2);
      const centerX = Number(bagInner?.width || 0) / 2;
      const centerZ = Number(bagInner?.depth || 0) / 2;
      const itemCenterX = Number(candidate.x || 0) + Number(sizeCm.w || 0) / 2;
      const itemCenterZ = Number(candidate.z || 0) + Number(sizeCm.d || 0) / 2;
      const offCenterDistance =
        Math.abs(centerX - itemCenterX) + Math.abs(centerZ - itemCenterZ);
      const centerBonus = Math.max(0, 6 - offCenterDistance * 0.25);

      const visualPlacementBonus = floorBonus + lowPlacementBonus + centerBonus;
      const finalScore = scored.totalScore + visualPlacementBonus;

      const evaluated = {
        positionCm: candidate,
        sizeCm,
        compressionAppliedRatio,
        supportType: supportCandidate.supportType,
        supportCoverageRatio: supportCheck.supportCoverageRatio,
        supportingItems: supportCheck.supportingItems,
        totalScore: finalScore,
        rawScore: scored.totalScore,
        visualPlacementBonus,
        scoreBreakdown: scored.breakdown,
        placementIssues: scored.issues || [],
        placementSuggestions: scored.suggestions || [],
      };

      if (!bestCandidate) {
        bestCandidate = evaluated;
        continue;
      }

      // if scores are close, prefer lower placement
      if (evaluated.totalScore > bestCandidate.totalScore + 0.25) {
        bestCandidate = evaluated;
        continue;
      }

      if (
        Math.abs(evaluated.totalScore - bestCandidate.totalScore) <= 0.25 &&
        Number(evaluated.positionCm.y || 0) < Number(bestCandidate.positionCm.y || 0)
      ) {
        bestCandidate = evaluated;
      }
    }
  }

  return bestCandidate;
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

function buildAssignedUnitsMap(bagResults = []) {
  const byBag = new Map();

  for (const bagResult of bagResults || []) {
    const bagId = Number(bagResult.bagId || 0);
    const bagItems = Array.isArray(bagResult.items) ? bagResult.items : [];
    const bagMap = new Map();

    for (const item of bagItems) {
      const tripItemId = Number(item.id || 0);
      const quantity = Math.max(0, Number(item.quantity || 0));

      if (!tripItemId || quantity <= 0) continue;

      const existingQuantity = Number(bagMap.get(tripItemId) || 0);
      bagMap.set(tripItemId, existingQuantity + quantity);
    }

    byBag.set(bagId, bagMap);
  }

  return byBag;
}

function buildOverflowUnitsMap(overflowItems = []) {
  const overflowMap = new Map();

  for (const item of overflowItems || []) {
    const tripItemId = Number(item.id || 0);
    const quantity = Math.max(0, Number(item.quantity || 0));

    if (!tripItemId || quantity <= 0) continue;

    const existingQuantity = Number(overflowMap.get(tripItemId) || 0);
    overflowMap.set(tripItemId, existingQuantity + quantity);
  }

  return overflowMap;
}

function buildSceneItemsForBag(tripItems = [], bagAssignments = new Map()) {
  const sceneItems = [];

  for (const tripItem of tripItems) {
    const tripItemId = Number(tripItem.id || 0);
    const quantityForBag = Number(bagAssignments.get(tripItemId) || 0);

    if (!tripItemId || quantityForBag <= 0) continue;

    const normalizedUnits = normalizeSceneItems([
      {
        ...tripItem,
        quantity: quantityForBag,
      },
    ]);

    sceneItems.push(...normalizedUnits);
  }

  return sceneItems;
}

function buildOverflowSceneItems(tripItems = [], overflowUnitsMap = new Map()) {
  const overflowSceneItems = [];

  for (const tripItem of tripItems) {
    const tripItemId = Number(tripItem.id || 0);
    const quantityForOverflow = Number(overflowUnitsMap.get(tripItemId) || 0);

    if (!tripItemId || quantityForOverflow <= 0) continue;

    const normalizedUnits = normalizeSceneItems([
      {
        ...tripItem,
        quantity: quantityForOverflow,
      },
    ]);

    overflowSceneItems.push(...normalizedUnits);
  }

  return overflowSceneItems;
}

function buildSingleBagScene({ bag, sceneItems, stepStartNumber }) {
  const inner = normalizeInnerBagDimensionsCm(bag);
  const zones = buildBagZones(inner);

  const sortedSceneItems = [...sceneItems].sort((a, b) => itemPriority(b) - itemPriority(a));

  const placedItems = [];
  const notPlacedInsideScene = [];
  const steps = [];

  let stepNumber = stepStartNumber;

  for (const item of sortedSceneItems) {
    const preferredZones = getPreferredZones(item);
    const zoneCandidates = preferredZones
      .map((zoneKey) => zones.find((zone) => zone.zoneKey === zoneKey))
      .filter(Boolean);

    const orientations = resolveOrientations(item);
    let bestPlacement = null;

    for (const zone of zoneCandidates) {
      for (const orientation of orientations) {
        const candidate = findBestPlacement(
          zone,
          orientation,
          placedItems,
          item,
          inner
        );

        if (!candidate) continue;

        const scoredPlacement = {
          tripItemId: item.tripItemId,
          sceneItemId: item.sceneItemId || String(item.tripItemId),
          itemId: item.itemId,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unitIndex: item.unitIndex || null,
          massG: item.massG,
          zoneKey: zone.zoneKey,
          positionCm: candidate.positionCm,
          sizeCm: candidate.sizeCm,
          rotationDeg: orientation.rotationDeg,
          renderHint: item.renderHint,
          stepNumber,
          bagId: bag.id,
          materialType: item.physicsProfile?.materialType || "semi_soft",
          rigidityScore: item.physicsProfile?.rigidityScore || 0,
          stackabilityScore: item.physicsProfile?.stackabilityScore || 0,
          canBeStackBase: !!item.physicsProfile?.canBeStackBase,
          supportType: candidate.supportType,
          supportCoverageRatio: candidate.supportCoverageRatio,
          compressionAppliedRatio: candidate.compressionAppliedRatio,
          placementScore: candidate.totalScore,
          placementScoreBreakdown: candidate.scoreBreakdown,
          placementIssues: candidate.placementIssues || [],
          placementSuggestions: candidate.placementSuggestions || [],
        };

        if (
          !bestPlacement ||
          scoredPlacement.placementScore > bestPlacement.placementScore
        ) {
          bestPlacement = scoredPlacement;
        }
      }
    }

    if (!bestPlacement) {
      notPlacedInsideScene.push(item);
      continue;
    }

    placedItems.push(bestPlacement);

    steps.push({
      stepNumber,
      tripItemId: bestPlacement.tripItemId,
      sceneItemId: bestPlacement.sceneItemId,
      bagId: bag.id,
      instruction: `Place ${bestPlacement.name} in ${bestPlacement.zoneKey.replace(/_/g, " ")} of ${bag.name}.`,
      highlightItemIds: [bestPlacement.sceneItemId],
      cameraHint: buildCameraHint(bestPlacement, inner),
      placementScore: bestPlacement.placementScore,
    });

    stepNumber += 1;
  }

  console.log("BAG SCENE RESULT:", {
    bagName: bag.name,
    requestedInBagPass: sceneItems.length,
    placedInBag: placedItems.length,
    notPlacedInsideScene: notPlacedInsideScene.length,
  });

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
    notPlacedInsideScene,
    steps,
    nextStepNumber: stepNumber,
  };
}

function buildPackingScene({
  tripId,
  bag,
  bags,
  tripItems = [],
  bagResults = [],
  overflowItems = [],
}) {
  const allBags =
    Array.isArray(bags) && bags.length > 0
      ? [...bags].sort((a, b) => getBagPriority(a) - getBagPriority(b))
      : bag
      ? [bag]
      : [];

  const assignedUnitsByBag = buildAssignedUnitsMap(bagResults);
  const authoritativeOverflowMap = buildOverflowUnitsMap(overflowItems);

  const bagScenes = [];
  const allPlacedItems = [];
  const allSteps = [];
  const scenePlacementFailures = [];
  let stepNumber = 1;

  for (const currentBag of allBags) {
    const bagId = Number(currentBag.id || 0);
    const bagAssignments = assignedUnitsByBag.get(bagId) || new Map();
    const sceneItemsForBag = buildSceneItemsForBag(tripItems, bagAssignments);

    if (!sceneItemsForBag.length) continue;

    const sceneResult = buildSingleBagScene({
      bag: currentBag,
      sceneItems: sceneItemsForBag,
      stepStartNumber: stepNumber,
    });

    bagScenes.push(sceneResult.bagScene);
    allPlacedItems.push(...sceneResult.placedItems);
    allSteps.push(...sceneResult.steps);
    scenePlacementFailures.push(...sceneResult.notPlacedInsideScene);

    stepNumber = sceneResult.nextStepNumber;
  }

  const authoritativeOverflowSceneItems = buildOverflowSceneItems(
    tripItems,
    authoritativeOverflowMap
  );

  const mergedOverflow = [
    ...authoritativeOverflowSceneItems,
    ...scenePlacementFailures,
  ];

  console.log("PACKING SCENE COUNTS:", {
    authoritativeBagItemCount: bagResults.reduce(
      (sum, bagResult) =>
        sum +
        (Array.isArray(bagResult.items)
          ? bagResult.items.reduce(
              (innerSum, item) => innerSum + Number(item.quantity || 0),
              0
            )
          : 0),
      0
    ),
    placedItems: allPlacedItems.length,
    stepCount: allSteps.length,
    authoritativeOverflowItems: authoritativeOverflowSceneItems.length,
    scenePlacementFailures: scenePlacementFailures.length,
    mergedOverflow: mergedOverflow.length,
    mergedOverflowNames: mergedOverflow.map((item) => item.name),
  });

  return {
    sceneVersion: 6,
    tripId,
    generatedAt: new Date().toISOString(),
    bags: bagScenes,
    primaryBag: bagScenes[0] || null,
    items: allPlacedItems,
    steps: allSteps,
    summary: {
      overallFits: mergedOverflow.length === 0,
      overflowItemCount: mergedOverflow.length,
      placedItemCount: allPlacedItems.length,
      bagCount: bagScenes.length,
    },
    warnings: mergedOverflow.length
      ? [
          `${mergedOverflow.length} item${
            mergedOverflow.length === 1 ? "" : "s"
          } could not be shown as placed in the available bags.`,
        ]
      : [],
    overflow: mergedOverflow.map((item) => ({
      tripItemId: item.tripItemId,
      sceneItemId: item.sceneItemId || String(item.tripItemId),
      itemId: item.itemId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unitIndex: item.unitIndex || null,
      reason: "Item remains outside the 3D placed scene.",
    })),
  };
}

module.exports = {
  buildPackingScene,
};