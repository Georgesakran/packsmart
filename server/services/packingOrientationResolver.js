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

  if (category === "documents") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.upright,
    ]);
  }

  if (category === "tech") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.upright,
    ]);
  }

  if (category === "shoes") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.side,
    ]);
  }

  if (category === "toiletries") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.side,
      o.upright,
    ]);
  }

  if (category === "underwear") {
    return uniqueOrientations([
      o.side,
      o.flat,
      o.flat_rotated,
    ]);
  }

  if (category === "accessories") {
    return uniqueOrientations([
      o.side,
      o.flat,
      o.flat_rotated,
      o.upright,
    ]);
  }

  if (category === "clothing" || category === "bottoms" || category === "outerwear") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
    ]);
  }

  if (travelDayMode === "keep_accessible") {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
      o.side,
    ]);
  }

  if (profile.keepFlat) {
    return uniqueOrientations([
      o.flat,
      o.flat_rotated,
    ]);
  }

  if (profile.keepUpright) {
    return uniqueOrientations([
      o.upright,
      o.upright_rotated,
    ]);
  }

  return uniqueOrientations([
    o.flat,
    o.flat_rotated,
    o.side,
  ]);
}

module.exports = {
  resolveOrientations,
};