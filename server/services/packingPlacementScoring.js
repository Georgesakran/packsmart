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

  if (key === "bottom_base") return 96;
  if (key === "middle_core") return 74;
  if (key === "top_layer") return 46;
  if (key === "side_channel_left" || key === "side_channel_right") return 54;
  if (key === "quick_access") return 38;

  return 50;
}

function getSupportQualityScore(supportType = "floor", supportCoverageRatio = 0) {
  if (supportType === "floor") return 95;
  return clampScore(40 + supportCoverageRatio * 60);
}

function getCompressionPenalty(profile, compressionAppliedRatio = 1) {
  if (!profile) return 0;

  const minAllowed = Number(profile.compressionRatioMin || 1);
  if (compressionAppliedRatio >= minAllowed) return 0;

  const overCompression = minAllowed - compressionAppliedRatio;
  return clampScore(overCompression * 240);
}

function getFragilityPenalty(profile, supportType, zoneKey) {
  if (!profile) return 0;

  let penalty = 0;
  const fragility = Number(profile.fragilityScore || 0);

  if (supportType === "stack") {
    penalty += fragility * 0.35;
  }

  if (normalizeZoneKey(zoneKey) === "bottom_base" && fragility >= 60) {
    penalty += 16;
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
    if (key === "side_channel_left" || key === "side_channel_right") bonus += 16;
  }

  if (profile.preferCenterZones) {
    if (key === "middle_core") bonus += 16;
    if (key === "bottom_base") bonus += 8;
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
  if (allowed.includes(orientationLabel)) return 72;
  return 20;
}

function getBaseCompatibilityBonus(profile, supportingItems = []) {
  if (!profile || !Array.isArray(supportingItems) || !supportingItems.length) {
    return 0;
  }

  let bonus = 0;

  for (const item of supportingItems) {
    const materialType = String(item.materialType || "").toLowerCase();
    const rigidityScore = Number(item.rigidityScore || 0);

    if (profile.fragilityScore >= 70) {
      if (materialType === "soft") bonus += 8;
      if (rigidityScore >= 75) bonus -= 6;
    }

    if (profile.canStackOnTopOfOthers && rigidityScore >= 65) {
      bonus += 5;
    }
  }

  return bonus;
}

function getHeavyItemBalanceScore(item, positionCm, bagInner) {
  const massG = Number(item.massG || 0);
  if (massG <= 0 || !bagInner) return 50;

  const centerX = Number(bagInner.width || 0) / 2;
  const centerZ = Number(bagInner.depth || 0) / 2;

  const x = Number(positionCm.x || 0);
  const z = Number(positionCm.z || 0);

  const dx = Math.abs(centerX - x);
  const dz = Math.abs(centerZ - z);

  const normalizedDistance =
    (dx / Math.max(1, centerX)) * 0.55 + (dz / Math.max(1, centerZ)) * 0.45;

  let score = 100 - normalizedDistance * 100;

  if (massG >= 1200) score += 10;
  if (massG <= 300) score -= 8;

  return clampScore(score);
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
  const preferred = Array.isArray(profile?.preferredOrientations)
    ? profile.preferredOrientations
    : [];

  if (supportType === "stack" && Number(supportCoverageRatio || 0) < 0.66) {
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

  if (breakdown && Number(breakdown.supportScore || 0) < 58) {
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
  orientation,
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
  const balanceScore = getHeavyItemBalanceScore(item, positionCm, bagInner);
  const compatibilityBonus = getBaseCompatibilityBonus(profile, supportingItems);

  const compressionPenalty = getCompressionPenalty(
    profile,
    compressionAppliedRatio
  );
  const fragilityPenalty = getFragilityPenalty(profile, supportType, zoneKey);

  const total =
    accessScore * 0.16 +
    stabilityScore * 0.23 +
    supportScore * 0.2 +
    orientationScore * 0.14 +
    balanceScore * 0.12 +
    preferenceBonus +
    compatibilityBonus -
    compressionPenalty -
    fragilityPenalty;

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