function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  function buildBagZones(inner) {
    const width = Number(inner.width || 30);
    const height = Number(inner.height || 50);
    const depth = Number(inner.depth || 20);
  
    const bottomHeight = clamp(Math.round(height * 0.28), 4, 8);
    const middleHeight = clamp(Math.round(height * 0.34), 5, 10);
    const topHeight = clamp(Math.round(height * 0.18), 3, 6);
    const quickHeight = clamp(height - bottomHeight - middleHeight - topHeight, 2, 5);
  
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
          d: Math.max(6, Math.round(depth * 0.35)),
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
          w: Math.max(3, Math.round(width * 0.12)),
          h: bottomHeight + middleHeight,
          d: depth,
        },
        priority: 5,
      },
      {
        zoneKey: "side_channel_right",
        label: "Side Channel Right",
        boundsCm: {
          x: width - Math.max(3, Math.round(width * 0.12)),
          y: 0,
          z: 0,
          w: Math.max(3, Math.round(width * 0.12)),
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