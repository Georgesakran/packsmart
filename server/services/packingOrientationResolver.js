// services/packingOrientationResolver.js

function uniqueOrientations(candidates = []) {
  const seen = new Set();

  return candidates.filter((candidate) => {
    const hash = `${candidate.key}-${candidate.sizeCm.w}-${candidate.sizeCm.h}-${candidate.sizeCm.d}`;
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

function buildBaseOrientations(w, h, d) {
  return {
    flat: {
      key: "flat",
      label: "flat",
      sizeCm: { w, h, d },
      rotationDeg: { x: 0, y: 0, z: 0 },
    },

    flat_rotated: {
      key: "flat_rotated",
      label: "flat",
      sizeCm: { w: d, h, d: w },
      rotationDeg: { x: 0, y: 90, z: 0 },
    },

    upright: {
      key: "upright",
      label: "upright",
      sizeCm: { w, h: d, d: h },
      rotationDeg: { x: 90, y: 0, z: 0 },
    },

    upright_rotated: {
      key: "upright_rotated",
      label: "upright",
      sizeCm: { w: d, h: w, d: h },
      rotationDeg: { x: 0, y: 0, z: 90 },
    },

    side: {
      key: "side",
      label: "side",
      sizeCm: { w: h, h: w, d },
      rotationDeg: { x: 0, y: 0, z: 90 },
    },

    side_rotated: {
      key: "side_rotated",
      label: "side",
      sizeCm: { w: h, h: d, d: w },
      rotationDeg: { x: 90, y: 90, z: 0 },
    },
  };
}

function resolveOrientations(item) {
  const w = Number(item.dimensionsCm?.w || 0);
  const h = Number(item.dimensionsCm?.h || 0);
  const d = Number(item.dimensionsCm?.d || 0);

  const category = String(item.category || "").toLowerCase();
  const travelDayMode = String(item.travel_day_mode || "normal").toLowerCase();
  const profile = item.physicsProfile || {};

  const o = buildBaseOrientations(w, h, d);

  // Documents: mostly flat, sometimes flat rotated, upright only as fallback
  if (category === "documents") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.upright,
    ]);
  }

  // Tech: prefer flat and stable placements, upright only fallback
  if (category === "tech") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.upright,
    ]);
  }

  // Shoes: grounded and realistic only
  // no weird upright hanging candidates
  if (category === "shoes") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.side,
    ]);
  }

  // Toiletries: flat first, side second, upright only as last resort
  if (category === "toiletries") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.side,
      o.upright,
    ]);
  }

  // Underwear / socks / soft fillers
  if (category === "underwear") {
    return uniqueOrientations([
      o.side,
      o.flat,
      o.flat_rotated,
    ]);
  }

  // Accessories: can fill gaps, but still avoid crazy rotations
  if (category === "accessories") {
    return uniqueOrientations([
      o.side,
      o.flat,
      o.flat_rotated,
      o.upright,
    ]);
  }

  // Folded garments: should stay flat in realistic packing
  if (category === "clothing" || category === "bottoms" || category === "outerwear") {
    return uniqueOrientations([
      base[0], // flat
      base[3], // flat_rotated
    ]);
  }

  // Keep-accessible items: allow a little flexibility, but still not everything
  if (travelDayMode === "keep_accessible") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.side,
    ]);
  }

  // Respect profile if item is marked as keepFlat
  if (profile.keepFlat) {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
    ]);
  }

  // Respect profile if item should stay upright
  if (profile.keepUpright) {
    return uniqueOrientations([
      o.upright,
      o.upright_rotated,
    ]);
  }

  // Default: conservative
  return uniqueOrientations([
    o.flat,
    o.flat_rotated,
    o.side,
  ]);
}

module.exports = {
  resolveOrientations,
};