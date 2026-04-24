//packingItemPhysicsProfile.js
  function normalizeCategory(category = "") {
    return String(category || "misc").toLowerCase();
  }
  
  function buildPackingItemPhysicsProfile(item = {}) {
    const category = normalizeCategory(item.category);
    const travelDayMode = String(item.travel_day_mode || "normal").toLowerCase();
    const packingStatus = String(item.packing_status || "pending").toLowerCase();
    const massG = Number(item.massG || 0);
  
    let profile = {
      materialType: "semi_soft", // rigid | semi_soft | soft
      rigidityScore: 50, // 0-100
      compressibilityScore: 35, // 0-100
      compressionRatioMin: 0.9,
      stackabilityScore: 50, // 0-100
      supportNeedScore: 45, // 0-100
      fragilityScore: 20, // 0-100
      topLoadToleranceScore: 50, // 0-100
      preferredOrientations: ["flat"],
      allowedOrientations: ["flat", "side", "upright"],
      keepFlat: false,
      keepUpright: false,
      avoidBottomZone: false,
      avoidTopZone: false,
      preferAccessibleZones: false,
      preferEdgeZones: false,
      preferCenterZones: false,
      canBeStackBase: false,
      canStackOnTopOfOthers: true,
      shouldNotBeCompressed: false,
      shouldBePackedLate: false,
      shouldBePackedEarly: false,
    };
  
    switch (category) {
      case "documents":
        profile = {
          ...profile,
          materialType: "semi_soft",
          rigidityScore: 35,
          compressibilityScore: 10,
          compressionRatioMin: 0.95,
          stackabilityScore: 65,
          supportNeedScore: 70,
          fragilityScore: 50,
          topLoadToleranceScore: 20,
          preferredOrientations: ["flat", "upright"],
          allowedOrientations: ["flat", "upright"],
          keepFlat: false,
          keepUpright: false,
          preferAccessibleZones: true,
          preferEdgeZones: false,
          preferCenterZones: false,
          canBeStackBase: false,
          canStackOnTopOfOthers: true,
          shouldNotBeCompressed: true,
          shouldBePackedLate: true,
        };
        break;
  
      case "tech":
        profile = {
          ...profile,
          materialType: "rigid",
          rigidityScore: 90,
          compressibilityScore: 0,
          compressionRatioMin: 1,
          stackabilityScore: 45,
          supportNeedScore: 85,
          fragilityScore: 80,
          topLoadToleranceScore: 18,
          preferredOrientations: ["flat", "upright"],
          allowedOrientations: ["flat", "upright", "side"],
          keepUpright: false,
          preferAccessibleZones: true,
          preferCenterZones: true,
          canBeStackBase: false,
          canStackOnTopOfOthers: true,
          shouldNotBeCompressed: true,
          shouldBePackedLate: true,
        };
        break;
  
      case "toiletries":
        profile = {
          ...profile,
          materialType: "semi_soft",
          rigidityScore: 60,
          compressibilityScore: 12,
          compressionRatioMin: 0.94,
          stackabilityScore: 58,
          supportNeedScore: 68,
          fragilityScore: 30,
          topLoadToleranceScore: 55,
          preferredOrientations: ["flat", "upright"],
          allowedOrientations: ["flat", "upright", "side"],
          canBeStackBase: true,
          canStackOnTopOfOthers: true,
          shouldNotBeCompressed: true,
          shouldBePackedEarly: true,
        };
        break;
  
        case "shoes":
          profile = {
            ...profile,
            materialType: "rigid",
            rigidityScore: 90,
            compressibilityScore: 2,
            compressionRatioMin: 0.99,
            stackabilityScore: 88,
            supportNeedScore: 82,
            fragilityScore: 8,
            topLoadToleranceScore: 92,
            preferredOrientations: ["flat", "side"],
            allowedOrientations: ["flat", "side"],
            preferCenterZones: true,
            canBeStackBase: true,
            canStackOnTopOfOthers: false,
            shouldNotBeCompressed: true,
            shouldBePackedEarly: true,
          };
          break;
  
          case "underwear":
            profile = {
              ...profile,
              materialType: "soft",
              rigidityScore: 8,
              compressibilityScore: 90,
              compressionRatioMin: 0.72,
              stackabilityScore: 42,
              supportNeedScore: 14,
              fragilityScore: 4,
              topLoadToleranceScore: 95,
              preferredOrientations: ["rolled", "flat"],
              allowedOrientations: ["rolled", "flat", "side"],
              preferEdgeZones: true,
              canBeStackBase: false,
              canStackOnTopOfOthers: true,
              shouldBePackedLate: true,
            };
            break;
            
  
      case "accessories":
        profile = {
          ...profile,
          materialType: "soft",
          rigidityScore: 18,
          compressibilityScore: 82,
          compressionRatioMin: 0.72,
          stackabilityScore: 72,
          supportNeedScore: 18,
          fragilityScore: 12,
          topLoadToleranceScore: 85,
          preferredOrientations: ["flat", "rolled", "upright"],
          allowedOrientations: ["flat", "rolled", "upright", "side"],
          preferAccessibleZones: travelDayMode === "keep_accessible",
          preferEdgeZones: true,
          canBeStackBase: false,
          canStackOnTopOfOthers: true,
          shouldBePackedLate: true,
        };
        break;
  
        case "bottoms":
          profile = {
            ...profile,
            materialType: "semi_soft",
            rigidityScore: 34,
            compressibilityScore: 58,
            compressionRatioMin: 0.8,
            stackabilityScore: 82,
            supportNeedScore: 34,
            fragilityScore: 8,
            topLoadToleranceScore: 88,
            preferredOrientations: ["flat"],
            allowedOrientations: ["flat", "side"],
            keepFlat: false,
            preferCenterZones: true,
            canBeStackBase: true,
            canStackOnTopOfOthers: true,
            shouldBePackedEarly: true,
          };
          break;
  
      case "outerwear":
        profile = {
          ...profile,
          materialType: "soft",
          rigidityScore: 22,
          compressibilityScore: 58,
          compressionRatioMin: 0.78,
          stackabilityScore: 60,
          supportNeedScore: 35,
          fragilityScore: 8,
          topLoadToleranceScore: 72,
          preferredOrientations: ["flat"],
          allowedOrientations: ["flat", "side"],
          preferCenterZones: true,
          canBeStackBase: false,
          canStackOnTopOfOthers: true,
          shouldBePackedMiddle: true,
        };
        break;
  
        case "clothing":
          profile = {
            ...profile,
            materialType: "soft",
            rigidityScore: 18,
            compressibilityScore: 62,
            compressionRatioMin: 0.8,
            stackabilityScore: 58,
            supportNeedScore: 34,
            fragilityScore: 6,
            topLoadToleranceScore: 72,
            preferredOrientations: ["flat"],
            allowedOrientations: ["flat", "side", "rolled"],
            preferCenterZones: true,
            canBeStackBase: false,
            canStackOnTopOfOthers: true,
          };
          break;
  
      default:
        profile = {
          ...profile,
          materialType: massG > 700 ? "semi_soft" : "soft",
          rigidityScore: massG > 700 ? 55 : 30,
          compressibilityScore: massG > 700 ? 22 : 55,
          compressionRatioMin: massG > 700 ? 0.9 : 0.8,
          stackabilityScore: 52,
          supportNeedScore: massG > 700 ? 58 : 30,
          fragilityScore: 18,
          topLoadToleranceScore: 55,
          preferredOrientations: ["flat"],
          allowedOrientations: ["flat", "side", "upright"],
        };
        break;
    }
  
    if (travelDayMode === "keep_accessible") {
      profile.preferAccessibleZones = true;
      profile.shouldBePackedLate = true;
    }
  
    if (packingStatus === "packed") {
      profile.stackabilityScore = Math.max(0, profile.stackabilityScore - 10);
    }
  
    return profile;
  }
  
  module.exports = {
    buildPackingItemPhysicsProfile,
  };