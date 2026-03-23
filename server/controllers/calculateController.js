const db = require("../config/db");

const getSimpleAdvice = (items, overallFits, volumeFits, weightFits, totals, suitcase) => {
  const advice = [];

  const rigidItems = items.filter((item) => item.packBehavior === "rigid");
  const bulkyItems = items.filter(
    (item) => item.finalVolumeCm3 >= 5000 || item.name.toLowerCase().includes("jacket") || item.name.toLowerCase().includes("hoodie")
  );
  const shoesCount = items
    .filter((item) => item.category === "shoes")
    .reduce((sum, item) => sum + item.quantity, 0);

  const customHeavyItems = items.filter(
    (item) => item.source === "custom" && item.finalWeightG >= 1000
  );

  if (!overallFits) {
    advice.push("Your selected items may not fit well in this suitcase.");
  }

  if (!volumeFits) {
    advice.push("Your packing volume is over the suitcase limit. Reduce bulky items first.");
  }

  if (!weightFits) {
    advice.push("Your luggage may exceed the airline weight limit. Remove heavier items first.");
  }

  if (totals.usedCapacityPercent >= 90 && totals.usedCapacityPercent <= 100) {
    advice.push("Your suitcase is almost full. Leave a little extra space for easier closing.");
  }

  if (totals.usedCapacityPercent > 100) {
    advice.push("Your suitcase is overfilled. Consider a larger suitcase or fewer items.");
  }

  const weightUsagePercent = (totals.weightKg / Number(suitcase.max_weight_kg)) * 100;

  if (weightUsagePercent >= 85 && weightUsagePercent <= 100) {
    advice.push("Your luggage is getting close to the weight limit.");
  }

  if (rigidItems.length >= 3) {
    advice.push("You have several rigid items. Pack them first to avoid wasted space.");
  }

  if (bulkyItems.length >= 2) {
    advice.push("You have multiple bulky items. Try wearing one of them during travel.");
  }

  if (shoesCount >= 2) {
    advice.push("Multiple pairs of shoes take a lot of space. Pack shoes at the edges or bottom.");
  } else if (shoesCount === 1) {
    advice.push("Place shoes at the bottom or edges of the suitcase.");
  }

  if (
    items.some((item) => item.packBehavior === "compressible")
  ) {
    advice.push("Use socks and underwear to fill empty corners and gaps.");
  }

  if (
    items.some(
      (item) =>
        item.category === "accessories" ||
        item.category === "custom" ||
        item.name.toLowerCase().includes("toiletry")
    )
  ) {
    advice.push("Keep toiletries and small essentials near the top for easy access.");
  }

  if (customHeavyItems.length > 0) {
    advice.push("One or more custom items are heavy. Double-check their weight before traveling.");
  }

  advice.push("Pack heavier items first and lighter items on top.");

  return [...new Set(advice)];
};

const getPackingPriority = (item) => {
  const name = item.name.toLowerCase();

  if (item.packBehavior === "rigid") {
    return 1;
  }

  if (
    name.includes("jacket") ||
    name.includes("hoodie") ||
    item.finalVolumeCm3 >= 5000
  ) {
    return 2;
  }

  if (item.packBehavior === "foldable") {
    return 3;
  }

  if (item.packBehavior === "compressible") {
    return 4;
  }

  return 5;
};

const getPackingZone = (item) => {
  const name = item.name.toLowerCase();

  if (item.packBehavior === "rigid" && item.category === "shoes") {
    return "bottom or edges";
  }

  if (item.packBehavior === "rigid") {
    return "bottom layer";
  }

  if (
    name.includes("jacket") ||
    name.includes("hoodie") ||
    item.finalVolumeCm3 >= 5000
  ) {
    return "bottom or middle layer";
  }

  if (item.packBehavior === "foldable") {
    return "middle layer";
  }

  if (item.packBehavior === "compressible") {
    return "corners and gaps";
  }

  return "middle layer";
};

const getPackingInstruction = (item) => {
  const name = item.name.toLowerCase();

  if (item.packBehavior === "rigid" && item.category === "shoes") {
    return "Place shoes at the bottom or edges to build the base structure.";
  }

  if (item.packBehavior === "rigid") {
    return "Pack rigid items first so softer items can fit around them.";
  }

  if (name.includes("jacket") || name.includes("hoodie")) {
    return "Place bulky outerwear early so it does not crush smaller packed items.";
  }

  if (item.packBehavior === "foldable") {
    return "Fold neatly and stack in the middle layer.";
  }

  if (item.packBehavior === "compressible") {
    return "Use this item to fill empty corners and small gaps at the end.";
  }

  return "Pack this item in the middle area of the suitcase.";
};

const getLayoutSection = (item, index) => {
  const zone = getPackingZone(item);

  if (zone === "bottom layer") return "bottomLayer";
  if (zone === "corners and gaps") return "cornersAndGaps";

  if (zone === "bottom or edges") {
    return index % 2 === 0 ? "leftSide" : "rightSide";
  }

  if (zone === "bottom or middle layer") {
    return "middleLayer";
  }

  return index % 2 === 0 ? "leftSide" : "rightSide";
};


const calculatePacking = (req, res) => {
  const { suitcaseId, customSuitcase, selectedItems, customItems = [] } = req.body;

  if ((!suitcaseId && !customSuitcase) || !selectedItems || !Array.isArray(selectedItems)) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const itemIds = selectedItems.map((item) => item.itemId).filter(Boolean);
  const itemsQuery = `SELECT * FROM items WHERE id IN (?)`;
  const sizesQuery = "SELECT * FROM size_multipliers";

  const resolveSuitcase = () => {
    return new Promise((resolve, reject) => {
      if (customSuitcase) {
        return resolve({
          id: customSuitcase.id || "custom-suitcase",
          name: customSuitcase.name || "Custom Suitcase",
          volume_cm3: Number(customSuitcase.volume_cm3),
          max_weight_kg: Number(customSuitcase.max_weight_kg),
        });
      }

      const suitcaseQuery = "SELECT * FROM suitcases WHERE id = ?";
      db.query(suitcaseQuery, [suitcaseId], (err, results) => {
        if (err) return reject(err);
        if (!results.length) return reject(new Error("Suitcase not found"));
        resolve(results[0]);
      });
    });
  };

  const fetchItems = itemIds.length
    ? new Promise((resolve, reject) => {
        db.query(itemsQuery, [itemIds], (itemsErr, itemsResults) => {
          if (itemsErr) reject(itemsErr);
          else resolve(itemsResults);
        });
      })
    : Promise.resolve([]);

  const fetchSizes = new Promise((resolve, reject) => {
    db.query(sizesQuery, (sizesErr, sizeResults) => {
      if (sizesErr) reject(sizesErr);
      else resolve(sizeResults);
    });
  });

  Promise.all([resolveSuitcase(), fetchItems, fetchSizes])
    .then(([suitcase, itemsResults, sizeResults]) => {
      const sizeMap = {};
      sizeResults.forEach((size) => {
        sizeMap[size.size_code] = Number(size.multiplier);
      });

      let totalVolumeCm3 = 0;
      let totalWeightG = 0;

      const detailedDbItems = selectedItems
        .map((selected) => {
          const dbItem = itemsResults.find((item) => item.id === selected.itemId);
          if (!dbItem) return null;

          let sizeMultiplier = 1;

          if (
            dbItem.size_mode === "alpha" &&
            selected.size &&
            sizeMap[selected.size]
          ) {
            sizeMultiplier = sizeMap[selected.size];
          }

          const quantity = Number(selected.quantity) || 0;
          const itemVolume = dbItem.base_volume_cm3 * sizeMultiplier * quantity;
          const itemWeight = dbItem.base_weight_g * sizeMultiplier * quantity;

          totalVolumeCm3 += itemVolume;
          totalWeightG += itemWeight;

          return {
            itemId: dbItem.id,
            name: dbItem.name,
            category: dbItem.category,
            quantity,
            selectedSize: selected.size || null,
            sizeMultiplier,
            baseVolumeCm3: dbItem.base_volume_cm3,
            baseWeightG: dbItem.base_weight_g,
            finalVolumeCm3: Math.round(itemVolume),
            finalWeightG: Math.round(itemWeight),
            packBehavior: dbItem.pack_behavior,
            source: "database",
          };
        })
        .filter(Boolean);

      const detailedCustomItems = customItems
        .map((item, index) => {
          const quantity = Number(item.quantity) || 0;
          const baseVolumeCm3 = Number(item.baseVolumeCm3) || 0;
          const baseWeightG = Number(item.baseWeightG) || 0;

          if (!item.name || quantity <= 0 || baseVolumeCm3 <= 0 || baseWeightG < 0) {
            return null;
          }

          const itemVolume = baseVolumeCm3 * quantity;
          const itemWeight = baseWeightG * quantity;

          totalVolumeCm3 += itemVolume;
          totalWeightG += itemWeight;

          return {
            itemId: `custom-${index + 1}`,
            name: item.name,
            category: "custom",
            quantity,
            selectedSize: null,
            sizeMultiplier: 1,
            baseVolumeCm3,
            baseWeightG,
            finalVolumeCm3: Math.round(itemVolume),
            finalWeightG: Math.round(itemWeight),
            packBehavior: item.packBehavior || "semi-rigid",
            source: "custom",
          };
        })
        .filter(Boolean);

      const allItems = [...detailedDbItems, ...detailedCustomItems];

      const sortedPackingItems = [...allItems].sort((a, b) => {
        const priorityDiff = getPackingPriority(a) - getPackingPriority(b);
      
        if (priorityDiff !== 0) return priorityDiff;
      
        return b.finalVolumeCm3 - a.finalVolumeCm3;
      });
      
      const packingOrder = sortedPackingItems.map((item, index) => ({
        step: index + 1,
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        packBehavior: item.packBehavior,
        finalVolumeCm3: item.finalVolumeCm3,
        finalWeightG: item.finalWeightG,
        zone: getPackingZone(item),
        instruction: getPackingInstruction(item),
      }));
      
      const suitcaseLayout = {
        bottomLayer: [],
        leftSide: [],
        rightSide: [],
        middleLayer: [],
        cornersAndGaps: [],
      };
      
      sortedPackingItems.forEach((item, index) => {
        const section = getLayoutSection(item, index);
      
        suitcaseLayout[section].push({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          packBehavior: item.packBehavior,
          finalVolumeCm3: item.finalVolumeCm3,
        });
      });

      const weightKg = Number((totalWeightG / 1000).toFixed(2));
      const usedCapacityPercent = Number(
        ((totalVolumeCm3 / suitcase.volume_cm3) * 100).toFixed(2)
      );
      const remainingVolumeCm3 = Math.max(0, suitcase.volume_cm3 - totalVolumeCm3);

      const volumeFits = totalVolumeCm3 <= suitcase.volume_cm3;
      const weightFits = weightKg <= Number(suitcase.max_weight_kg);
      const overallFits = volumeFits && weightFits;

      const advice = getSimpleAdvice(
        allItems,
        overallFits,
        volumeFits,
        weightFits,
        {
          totalVolumeCm3,
          totalWeightG,
          weightKg,
          usedCapacityPercent,
          remainingVolumeCm3,
        },
        suitcase
      );
      return res.status(200).json({
        suitcase: {
          id: suitcase.id,
          name: suitcase.name,
          volumeCm3: Number(suitcase.volume_cm3),
          maxWeightKg: Number(suitcase.max_weight_kg),
        },
        totals: {
          totalVolumeCm3: Math.round(totalVolumeCm3),
          totalWeightG: Math.round(totalWeightG),
          weightKg,
          usedCapacityPercent,
          remainingVolumeCm3: Math.round(remainingVolumeCm3),
          volumeFits,
          weightFits,
          overallFits,
        },
        items: allItems,
        packingOrder,
        suitcaseLayout,
        advice,
      });
    })
    .catch((error) => {
      console.error("Calculation error:", error.message);
      if (error.message === "Suitcase not found") {
        return res.status(404).json({ message: "Suitcase not found" });
      }
      return res.status(500).json({ message: "Server error" });
    });
};

module.exports = { calculatePacking };