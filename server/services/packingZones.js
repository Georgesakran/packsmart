function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildBagZones(inner) {
  const width = Number(inner.width || 30);
  const height = Number(inner.height || 50);
  const depth = Number(inner.depth || 20);

  // quick-access pocket at the top/front
  const quickHeight = clamp(Math.round(height * 0.14), 4, 8);

  // main packing body must use the REST of the suitcase height fully
  const mainHeight = Math.max(12, height - quickHeight);

  let bottomHeight = Math.round(mainHeight * 0.38);
  let middleHeight = Math.round(mainHeight * 0.34);

  bottomHeight = Math.max(6, bottomHeight);
  middleHeight = Math.max(6, middleHeight);

  let topHeight = mainHeight - bottomHeight - middleHeight;

  if (topHeight < 4) {
    const shortage = 4 - topHeight;
    middleHeight = Math.max(6, middleHeight - shortage);
    topHeight = mainHeight - bottomHeight - middleHeight;
  }

  const sideWidth = Math.max(3, Math.round(width * 0.14));
  const quickDepth = Math.max(5, Math.round(depth * 0.35));

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
        y: mainHeight,
        z: 0,
        w: width,
        h: quickHeight,
        d: quickDepth,
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
        h: mainHeight,
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
        h: mainHeight,
        d: depth,
      },
      priority: 6,
    },
  ];
}

module.exports = {
  buildBagZones,
};