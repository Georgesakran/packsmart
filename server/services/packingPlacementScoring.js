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
  
    return {
      totalScore: Math.round(total * 100) / 100,
      breakdown: {
        accessScore,
        stabilityScore,
        supportScore,
        orientationScore,
        balanceScore,
        preferenceBonus,
        compatibilityBonus,
        compressionPenalty,
        fragilityPenalty,
      },
    };
  }
  
  module.exports = {
    scorePlacementCandidate,
  };