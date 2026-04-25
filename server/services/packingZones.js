function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildBagZones(inner) {
  const width = Number(inner.width || 30);
  const height = Number(inner.height || 20);
  const depth = Number(inner.depth || 50);

  const bottomHeight = clamp(Math.round(height * 0.5), 9, 12);
  const middleHeight = clamp(Math.round(height * 0.25), 4, 6);
  const topHeight = clamp(Math.round(height * 0.12), 2, 3);

  let quickHeight = height - bottomHeight - middleHeight - topHeight;
  quickHeight = clamp(quickHeight, 1, 3);

  const sideWidth = clamp(Math.round(width * 0.12), 3, 5);

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
        y: bottomHeight + middleHeight + topHeight,
        z: 0,
        w: width,
        h: quickHeight,
        d: Math.max(8, Math.round(depth * 0.3)),
      },
      priority: 4,
    },
    {
      zoneKey: "side_channel_left",
      label: "Side Channel Left",
      boundsCm: {
        x: 0,
        y: 0,
        z: 0,
        w: sideWidth,
        h: bottomHeight + middleHeight,
        d: depth,
      },
      priority: 5,
    },
    {
      zoneKey: "side_channel_right",
      label: "Side Channel Right",
      boundsCm: {
        x: width - sideWidth,
        y: 0,
        z: 0,
        w: sideWidth,
        h: bottomHeight + middleHeight,
        d: depth,
      },
      priority: 6,
    },
  ];
}

module.exports = {
  buildBagZones,
};