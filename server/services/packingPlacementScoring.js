function normalizeZoneKey(zoneKey = "") {
  return String(zoneKey || "").toLowerCase();
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function getZoneAccessScore(zoneKey) {
  const key = normalizeZoneKey(zoneKey);

  if (key === "quick_access") return 100;
  if (key === "top_layer") return 82;
  if (key === "side_channel_left" || key === "side_channel_right") return 74;
  if (key === "middle_core") return 52;
  if (key === "bottom_base") return 28;

  return 40;
}

function getZoneStabilityScore(zoneKey) {
  const key = normalizeZoneKey(zoneKey);

  if (key === "bottom_base") return 98;
  if (key === "middle_core") return 78;
  if (key === "top_layer") return 42;
  if (key === "side_channel_left" || key === "side_channel_right") return 48;
  if (key === "quick_access") return 34;

  return 50;
}

function getSupportQualityScore(supportType = "floor", supportCoverageRatio = 0) {
  if (supportType === "floor") return 100;

  const ratio = Number(supportCoverageRatio || 0);

  if (ratio >= 0.95) return 92;
  if (ratio >= 0.85) return 82;
  if (ratio >= 0.75) return 68;
  if (ratio >= 0.65) return 52;
  if (ratio >= 0.55) return 36;

  return 18;
}

function getCompressionPenalty(profile, compressionAppliedRatio = 1) {
  if (!profile) return 0;

  const minAllowed = Number(profile.compressionRatioMin || 1);
  if (compressionAppliedRatio >= minAllowed) return 0;

  const overCompression = minAllowed - compressionAppliedRatio;
  return clampScore(overCompression * 320);
}

function getFragilityPenalty(profile, supportType, zoneKey) {
  if (!profile) return 0;

  let penalty = 0;
  const fragility = Number(profile.fragilityScore || 0);

  if (supportType === "stack") {
    penalty += fragility * 0.45;
  }

  if (normalizeZoneKey(zoneKey) === "bottom_base" && fragility >= 60) {
    penalty += 18;
  }

  if (normalizeZoneKey(zoneKey) === "top_layer" && fragility <= 15) {
    penalty -= 4;
  }

  return Math.max(0, penalty);
}

function getZonePreferenceBonus(profile, zoneKey) {
  if (!profile) return 0;

  const key = normalizeZoneKey(zoneKey);
  let bonus = 0;

  if (profile.preferAccessibleZones) {
    if (key === "quick_access") bonus += 22;
    if (key === "top_layer") bonus += 12;
    if (key === "bottom_base") bonus -= 18;
  }

  if (profile.preferEdgeZones) {
    if (key === "side_channel_left" || key === "side_channel_right") bonus += 14;
  }

  if (profile.preferCenterZones) {
    if (key === "middle_core") bonus += 18;
    if (key === "bottom_base") bonus += 14;
    if (key === "top_layer") bonus -= 8;
  }

  if (profile.avoidBottomZone && key === "bottom_base") {
    bonus -= 22;
  }

  if (profile.avoidTopZone && key === "top_layer") {
    bonus -= 18;
  }

  return bonus;
}

function getOrientationScore(profile, orientationLabel = "flat") {
  if (!profile) return 50;

  const preferred = Array.isArray(profile.preferredOrientations)
    ? profile.preferredOrientations
    : [];
  const allowed = Array.isArray(profile.allowedOrientations)
    ? profile.allowedOrientations
    : [];

  if (preferred.includes(orientationLabel)) return 100;
  if (allowed.includes(orientationLabel)) return 70;
  return 18;
}

function getBaseCompatibilityBonus(profile, supportingItems = []) {
  if (!profile || !Array.isArray(supportingItems) || !supportingItems.length) {
    return 0;
  }

  let bonus = 0;

  for (const item of supportingItems) {
    const materialType = String(item.materialType || "").toLowerCase();
    const rigidityScore = Number(item.rigidityScore || 0);
    const stackabilityScore = Number(item.stackabilityScore || 0);

    if (profile.fragilityScore >= 70) {
      if (materialType === "soft") bonus += 6;
      if (rigidityScore >= 75) bonus -= 8;
    }

    if (profile.canStackOnTopOfOthers && rigidityScore >= 65) {
      bonus += 4;
    }

    if (stackabilityScore < 55) {
      bonus -= 10;
    }
  }

  return bonus;
}

function getHeavyItemBalanceScore(item, positionCm, bagInner, sizeCm) {
  const massG = Number(item.massG || 0);
  if (massG <= 0 || !bagInner) return 50;

  const itemWidth = Number(sizeCm?.w || 0);
  const itemDepth = Number(sizeCm?.d || 0);

  const centerX = Number(bagInner.width || 0) / 2;
  const centerZ = Number(bagInner.depth || 0) / 2;

  const itemCenterX = Number(positionCm.x || 0) + itemWidth / 2;
  const itemCenterZ = Number(positionCm.z || 0) + itemDepth / 2;

  const dx = Math.abs(centerX - itemCenterX);
  const dz = Math.abs(centerZ - itemCenterZ);

  const normalizedDistance =
    (dx / Math.max(1, centerX)) * 0.55 + (dz / Math.max(1, centerZ)) * 0.45;

  let score = 100 - normalizedDistance * 100;

  if (massG >= 1200) score += 10;
  if (massG <= 300) score -= 8;

  return clampScore(score);
}

function getVerticalPlacementPenalty({
  item,
  profile,
  zoneKey,
  supportType,
  positionCm,
  sizeCm,
  bagInner,
}) {
  if (!bagInner) return 0;

  const itemBottomY = Number(positionCm?.y || 0);
  const bagHeight = Number(bagInner?.height || 1);
  const relativeHeight = bagHeight > 0 ? itemBottomY / bagHeight : 0;

  const massG = Number(item?.massG || 0);
  const fragility = Number(profile?.fragilityScore || 0);
  const rigidity = Number(profile?.rigidityScore || 0);

  let penalty = 0;

  if (supportType === "stack") {
    penalty += 8;
  }

  if (relativeHeight > 0.55) {
    penalty += 10;
  }

  if (relativeHeight > 0.7) {
    penalty += 12;
  }

  if (massG >= 600 && relativeHeight > 0.35) {
    penalty += 18;
  }

  if (massG >= 900 && supportType === "stack") {
    penalty += 24;
  }

  if (rigidity >= 75 && supportType === "stack") {
    penalty += 12;
  }

  if (fragility >= 70 && supportType === "stack") {
    penalty += 18;
  }

  if (zoneKey === "top_layer" && massG >= 450) {
    penalty += 16;
  }

  return penalty;
}

function buildPlacementIssues({
  item,
  profile,
  zone,
  orientation,
  supportType,
  supportCoverageRatio,
  compressionAppliedRatio,
  breakdown,
}) {
  const issues = [];
  const zoneKey = normalizeZoneKey(zone?.zoneKey || "");
  const fragility = Number(profile?.fragilityScore || 0);
  const massG = Number(item?.massG || 0);
  const rigidity = Number(profile?.rigidityScore || 0);
  const preferred = Array.isArray(profile?.preferredOrientations)
    ? profile.preferredOrientations
    : [];

  if (supportType === "stack" && Number(supportCoverageRatio || 0) < 0.75) {
    issues.push({
      code: "low_support_coverage",
      severity: "high",
      message: "Low support coverage under this item.",
    });
  }

  if (
    profile &&
    Number(compressionAppliedRatio || 1) <
      Number(profile.compressionRatioMin || 1)
  ) {
    issues.push({
      code: "too_much_compression",
      severity: "high",
      message: "This placement compresses the item more than recommended.",
    });
  } else if (Number(compressionAppliedRatio || 1) < 0.86) {
    issues.push({
      code: "heavy_compression",
      severity: "medium",
      message: "This placement applies strong compression.",
    });
  }

  if (fragility >= 70 && supportType === "stack") {
    issues.push({
      code: "fragile_on_stack",
      severity: "high",
      message: "Fragile item is resting on a stacked base.",
    });
  }

  if (fragility >= 70 && zoneKey === "bottom_base") {
    issues.push({
      code: "fragile_in_bottom_zone",
      severity: "medium",
      message: "Fragile item is placed in a bottom support zone.",
    });
  }

  if (
    massG >= 700 &&
    supportType === "stack"
  ) {
    issues.push({
      code: "heavy_item_on_stack",
      severity: "high",
      message: "Heavy item is placed on a stacked surface instead of a grounded base.",
    });
  }

  if (
    rigidity >= 75 &&
    supportType === "stack"
  ) {
    issues.push({
      code: "rigid_item_on_stack",
      severity: "medium",
      message: "Rigid item is stacked above other items instead of being grounded.",
    });
  }

  if (
    massG >= 1200 &&
    breakdown &&
    Number(breakdown.balanceScore || 0) < 55
  ) {
    issues.push({
      code: "heavy_off_center",
      severity: "medium",
      message: "Heavy item is positioned away from the bag center.",
    });
  }

  if (
    profile?.preferAccessibleZones &&
    !["quick_access", "top_layer", "side_channel_left", "side_channel_right"].includes(zoneKey)
  ) {
    issues.push({
      code: "accessibility_mismatch",
      severity: "medium",
      message: "This item prefers a more accessible zone.",
    });
  }

  if (
    preferred.length > 0 &&
    !preferred.includes(String(orientation?.label || "").toLowerCase())
  ) {
    issues.push({
      code: "orientation_not_preferred",
      severity: "low",
      message: "Orientation is allowed, but not preferred for this item.",
    });
  }

  if (breakdown && Number(breakdown.stabilityScore || 0) < 50) {
    issues.push({
      code: "low_stability_zone",
      severity: "medium",
      message: "This zone provides relatively low placement stability.",
    });
  }

  if (breakdown && Number(breakdown.supportScore || 0) < 60) {
    issues.push({
      code: "weak_support_score",
      severity: "medium",
      message: "Support quality is weaker than ideal.",
    });
  }

  return issues;
}

function dedupeSuggestions(suggestions = []) {
  const seen = new Set();
  return suggestions.filter((entry) => {
    const key = `${entry.code}::${entry.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildPlacementSuggestions({
  issues = [],
  profile,
  zone,
}) {
  const suggestions = [];
  const zoneKey = normalizeZoneKey(zone?.zoneKey || "");
  const preferred = Array.isArray(profile?.preferredOrientations)
    ? profile.preferredOrientations
    : [];

  for (const issue of issues) {
    switch (issue.code) {
      case "low_support_coverage":
      case "weak_support_score":
        suggestions.push({
          code: "move_to_stabler_base",
          priority: "high",
          message: "Place this item on a flatter, more stable base.",
        });
        break;

      case "too_much_compression":
      case "heavy_compression":
        suggestions.push({
          code: "reduce_compression",
          priority: "high",
          message: "Move this item to a roomier zone to reduce compression.",
        });
        break;

      case "fragile_on_stack":
        suggestions.push({
          code: "avoid_stack_for_fragile",
          priority: "high",
          message: "Place this fragile item directly on the bag floor or a more stable layer.",
        });
        break;

      case "fragile_in_bottom_zone":
        suggestions.push({
          code: "move_fragile_higher",
          priority: "medium",
          message: "Move this fragile item to a higher, safer zone.",
        });
        break;

      case "heavy_item_on_stack":
      case "rigid_item_on_stack":
        suggestions.push({
          code: "ground_heavy_or_rigid_item",
          priority: "high",
          message: "Move this item to bottom base or a directly supported middle area.",
        });
        break;

      case "heavy_off_center":
        suggestions.push({
          code: "move_heavy_to_center",
          priority: "medium",
          message: "Keep this heavier item closer to the bag center for better balance.",
        });
        break;

      case "accessibility_mismatch":
        suggestions.push({
          code: "move_to_accessible_zone",
          priority: "medium",
          message: "Move this item to quick access, top layer, or a side access channel.",
        });
        break;

      case "orientation_not_preferred":
        suggestions.push({
          code: "use_preferred_orientation",
          priority: "low",
          message: `Prefer ${preferred.join(" / ")} orientation for a better fit.`,
        });
        break;

      case "low_stability_zone":
        suggestions.push({
          code: "move_to_stable_zone",
          priority: "medium",
          message: "Try a more stable zone such as bottom base or middle core.",
        });
        break;

      default:
        break;
    }
  }

  if (
    profile?.preferAccessibleZones &&
    !["quick_access", "top_layer", "side_channel_left", "side_channel_right"].includes(zoneKey)
  ) {
    suggestions.push({
      code: "prefer_accessible_zone",
      priority: "medium",
      message: "This item would perform better in a more accessible zone.",
    });
  }

  if (zoneKey === "bottom_base" && Number(profile?.fragilityScore || 0) >= 60) {
    suggestions.push({
      code: "avoid_bottom_for_fragile",
      priority: "medium",
      message: "Avoid placing fragile items deep in the bottom base when possible.",
    });
  }

  return dedupeSuggestions(suggestions);
}

function scorePlacementCandidate({
  item,
  profile,
  zone,
  positionCm,
  sizeCm,
  orientation,
  supportType = "floor",
  supportCoverageRatio = 1,
  supportingItems = [],
  compressionAppliedRatio = 1,
  bagInner,
}) {
  const zoneKey = zone?.zoneKey || "";
  const accessScore = getZoneAccessScore(zoneKey);
  const stabilityScore = getZoneStabilityScore(zoneKey);
  const supportScore = getSupportQualityScore(supportType, supportCoverageRatio);
  const preferenceBonus = getZonePreferenceBonus(profile, zoneKey);
  const orientationScore = getOrientationScore(profile, orientation?.label || "flat");
  const balanceScore = getHeavyItemBalanceScore(item, positionCm, bagInner, sizeCm);
  const compatibilityBonus = getBaseCompatibilityBonus(profile, supportingItems);

  const compressionPenalty = getCompressionPenalty(
    profile,
    compressionAppliedRatio
  );
  const fragilityPenalty = getFragilityPenalty(profile, supportType, zoneKey);
  const verticalPlacementPenalty = getVerticalPlacementPenalty({
    item,
    profile,
    zoneKey: normalizeZoneKey(zoneKey),
    supportType,
    positionCm,
    sizeCm,
    bagInner,
  });

  const total =
    accessScore * 0.12 +
    stabilityScore * 0.24 +
    supportScore * 0.24 +
    orientationScore * 0.12 +
    balanceScore * 0.14 +
    preferenceBonus +
    compatibilityBonus -
    compressionPenalty -
    fragilityPenalty -
    verticalPlacementPenalty;

  const breakdown = {
    accessScore,
    stabilityScore,
    supportScore,
    orientationScore,
    balanceScore,
    preferenceBonus,
    compatibilityBonus,
    compressionPenalty,
    fragilityPenalty,
    verticalPlacementPenalty,
  };

  const issues = buildPlacementIssues({
    item,
    profile,
    zone,
    orientation,
    supportType,
    supportCoverageRatio,
    compressionAppliedRatio,
    breakdown,
  });

  const suggestions = buildPlacementSuggestions({
    issues,
    profile,
    zone,
    orientation,
  });

  return {
    totalScore: Math.round(total * 100) / 100,
    breakdown,
    issues,
    suggestions,
  };
}

module.exports = {
  scorePlacementCandidate,
};