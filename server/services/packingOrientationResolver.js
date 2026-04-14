function uniqueOrientations(candidates = []) {
  const seen = new Set();

  return candidates.filter((candidate) => {
    const hash = `${candidate.sizeCm.w}-${candidate.sizeCm.h}-${candidate.sizeCm.d}`;
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

function resolveOrientations(item) {
  const w = Number(item.dimensionsCm?.w || 0);
  const h = Number(item.dimensionsCm?.h || 0);
  const d = Number(item.dimensionsCm?.d || 0);

  const category = String(item.category || "").toLowerCase();

  const base = [
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
  ];

  if (category === "documents" || category === "tech") {
    return uniqueOrientations([
      base[1],
      base[0],
    ]);
  }

  if (category === "shoes") {
    return uniqueOrientations([
      base[0],
      base[2],
    ]);
  }

  if (category === "underwear" || category === "accessories") {
    return uniqueOrientations([
      base[2],
      base[0],
      base[1],
    ]);
  }

  return uniqueOrientations(base);
}

module.exports = {
  resolveOrientations,
};