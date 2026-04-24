function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildBagZones(inner) {
  const width = Number(inner.width || 30);
  const height = Number(inner.height || 50);
  const depth = Number(inner.depth || 20);

  const bottomHeight = clamp(Math.round(height * 0.42), 9, Math.max(9, height - 8));
  const topHeight = clamp(Math.round(height * 0.18), 3, 6);
  const middleHeight = Math.max(4, height - bottomHeight - topHeight);

  return [
    {
      zoneKey: "bottom_base",
      label: "Bottom Base",
      boundsCm: {
        x: 0,
        y: 0,
        z: 0,
        w: width,
        h: bottomHeight,
        d: depth,
      },
      priority: 1,
    },
    {
      zoneKey: "middle_core",
      label: "Middle Core",
      boundsCm: {
        x: 0,
        y: bottomHeight,
        z: 0,
        w: width,
        h: middleHeight,
        d: depth,
      },
      priority: 2,
    },
    {
      zoneKey: "top_layer",
      label: "Top Layer",
      boundsCm: {
        x: 0,
        y: bottomHeight + middleHeight,
        z: 0,
        w: width,
        h: topHeight,
        d: depth,
      },
      priority: 3,
    },
    {
      zoneKey: "quick_access",
      label: "Quick Access",
      boundsCm: {
        x: 0,
        y: Math.max(0, height - Math.max(4, Math.round(height * 0.12))),
        z: 0,
        w: width,
        h: Math.max(4, Math.round(height * 0.12)),
        d: depth,
      },
      priority: 4,
    },
  ];
}

module.exports = {
  buildBagZones,
};