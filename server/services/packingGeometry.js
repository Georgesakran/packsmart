function makeBox(positionCm, sizeCm) {
    return {
      minX: positionCm.x,
      minY: positionCm.y,
      minZ: positionCm.z,
      maxX: positionCm.x + sizeCm.w,
      maxY: positionCm.y + sizeCm.h,
      maxZ: positionCm.z + sizeCm.d,
    };
  }
  
  function boxesOverlap(a, b) {
    return (
      a.minX < b.maxX &&
      a.maxX > b.minX &&
      a.minY < b.maxY &&
      a.maxY > b.minY &&
      a.minZ < b.maxZ &&
      a.maxZ > b.minZ
    );
  }
  
  function fitsInside(bounds, positionCm, sizeCm) {
    return (
      positionCm.x >= bounds.x &&
      positionCm.y >= bounds.y &&
      positionCm.z >= bounds.z &&
      positionCm.x + sizeCm.w <= bounds.x + bounds.w &&
      positionCm.y + sizeCm.h <= bounds.y + bounds.h &&
      positionCm.z + sizeCm.d <= bounds.z + bounds.d
    );
  }
  
  function getCenter(positionCm, sizeCm) {
    return {
      x: positionCm.x + sizeCm.w / 2,
      y: positionCm.y + sizeCm.h / 2,
      z: positionCm.z + sizeCm.d / 2,
    };
  }
  
  module.exports = {
    makeBox,
    boxesOverlap,
    fitsInside,
    getCenter,
  };