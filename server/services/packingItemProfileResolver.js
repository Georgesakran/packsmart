const {
    PACKING_ITEM_PROFILES,
    CLOTHING_SIZE_SCALE,
    SHOE_SIZE_SCALE,
  } = require("./packingItemProfiles");
  
  function normalizeText(value = "") {
    return String(value || "").trim().toLowerCase();
  }
  
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  function getScaleForSize(profile, sizeCode) {
    if (!profile || !profile.sizeType) return 1;
  
    if (profile.sizeType === "clothing") {
      return CLOTHING_SIZE_SCALE[String(sizeCode || "").toUpperCase()] || 1;
    }
  
    if (profile.sizeType === "shoes") {
      return SHOE_SIZE_SCALE[String(sizeCode || "")] || 1;
    }
  
    return 1;
  }
  
  function scaleDimensions(dimensionsCm, scale = 1) {
    return {
      w: Math.round(Number(dimensionsCm.w || 0) * scale * 10) / 10,
      h: Math.round(Number(dimensionsCm.h || 0) * scale * 10) / 10,
      d: Math.round(Number(dimensionsCm.d || 0) * scale * 10) / 10,
    };
  }
  
  function scaleWeight(weightG, scale = 1) {
    return Math.round(Number(weightG || 0) * (0.8 + (scale - 1) * 0.65));
  }
  
  function findBestProfileByNameAndCategory(name, category) {
    const normalizedName = normalizeText(name);
    const normalizedCategory = normalizeText(category);
  
    const profiles = Object.values(PACKING_ITEM_PROFILES);
  
    for (const profile of profiles) {
      const categoryMatch =
        !normalizedCategory || normalizeText(profile.category) === normalizedCategory;
  
      if (!categoryMatch) continue;
  
      for (const alias of profile.aliases || []) {
        if (normalizedName.includes(normalizeText(alias))) {
          return profile;
        }
      }
    }
  
    const categoryDefaults = {
      clothing: PACKING_ITEM_PROFILES.tshirt_basic,
      bottoms: PACKING_ITEM_PROFILES.pants_basic,
      outerwear: PACKING_ITEM_PROFILES.hoodie_bulky,
      underwear: PACKING_ITEM_PROFILES.underwear_basic,
      shoes: PACKING_ITEM_PROFILES.shoes_standard_pair,
      toiletries: PACKING_ITEM_PROFILES.toiletries_pouch,
      tech: PACKING_ITEM_PROFILES.tech_generic,
      documents: PACKING_ITEM_PROFILES.passport_flat,
      accessories: PACKING_ITEM_PROFILES.accessories_basic,
      misc: PACKING_ITEM_PROFILES.misc_generic,
    };
  
    return categoryDefaults[normalizedCategory] || PACKING_ITEM_PROFILES.misc_generic;
  }
  
  function resolveItemProfile({
    customName,
    baseItemName,
    category,
    sizeCode,
  }) {
    const displayName = customName || baseItemName || "Item";
    const matchedProfile = findBestProfileByNameAndCategory(displayName, category);
    const profile = clone(matchedProfile);
  
    const scale = getScaleForSize(profile, sizeCode);
    const scaledDimensions = scaleDimensions(profile.base.dimensionsCm, scale);
    const scaledWeightG = scaleWeight(profile.base.weightG, scale);
  
    const volumeCm3 =
      Number(scaledDimensions.w || 0) *
      Number(scaledDimensions.h || 0) *
      Number(scaledDimensions.d || 0);
  
    return {
      profileKey: profile.key,
      profileCategory: profile.category,
      displayName,
      dimensionsCm: scaledDimensions,
      weightG: scaledWeightG,
      volumeCm3: Math.round(volumeCm3),
      materialType: profile.base.materialType,
      rigidityScore: profile.base.rigidityScore,
      compressibilityScore: profile.base.compressibilityScore,
      stackabilityScore: profile.base.stackabilityScore,
      preferredOrientations: profile.base.preferredOrientations || ["flat"],
      allowedOrientations: profile.base.allowedOrientations || ["flat"],
      renderHint: profile.base.renderHint || null,
      foldStyle: profile.base.foldStyle || "auto",
      sizeScale: scale,
    };
  }
  
  module.exports = {
    resolveItemProfile,
  };