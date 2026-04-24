// services/packingOrientationResolver.js
function uniqueOrientations(candidates = []) {
  const seen = new Set();

  return candidates.filter((candidate) => {
    const hash = `${candidate.sizeCm.w}-${candidate.sizeCm.h}-${candidate.sizeCm.d}`;
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

function buildBaseOrientations(w, h, d) {
  return [
    {
      key: "flat",
      sizeCm: { w, h, d },
      rotationDeg: { x: 0, y: 0, z: 0 },
    },
    {
      key: "upright",
      sizeCm: { w: d, h: w, d: h },
      rotationDeg: { x: 0, y: 0, z: 90 },
    },
    {
      key: "side",
      sizeCm: { w: h, h: d, d: w },
      rotationDeg: { x: 90, y: 0, z: 0 },
    },
    {
      key: "flat_rotated",
      sizeCm: { w: d, h, d: w },
      rotationDeg: { x: 0, y: 90, z: 0 },
    },
    {
      key: "upright_rotated",
      sizeCm: { w: h, h: w, d: d },
      rotationDeg: { x: 0, y: 90, z: 90 },
    },
    {
      key: "side_rotated",
      sizeCm: { w, h: d, d: h },
      rotationDeg: { x: 90, y: 90, z: 0 },
    },
  ];
}

function resolveOrientations(item) {
  const w = Number(item.dimensionsCm?.w || 0);
  const h = Number(item.dimensionsCm?.h || 0);
  const d = Number(item.dimensionsCm?.d || 0);

  const category = String(item.category || "").toLowerCase();

  const base = buildBaseOrientations(w, h, d);

  if (category === "documents" || category === "tech") {
    return uniqueOrientations([
      base[0],
      base[3],
      base[1],
      base[4],
    ]);
  }

  if (category === "shoes") {
    return uniqueOrientations([
      base[0],
      base[2],
      base[1],
      base[3],
      base[5],
      base[4],
    ]);
  }

  if (category === "underwear" || category === "accessories") {
    return uniqueOrientations([
      base[2],
      base[0],
      base[1],
      base[5],
      base[3],
      base[4],
    ]);
  }

  return uniqueOrientations(base);
}

module.exports = {
  resolveOrientations,
};