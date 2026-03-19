const db = require("../config/db");

const getSimpleAdvice = (items, overallFits, volumeFits, weightFits) => {
  const advice = [];

  const hasShoes = items.some((item) => item.packBehavior === "rigid" && item.category === "shoes");
  const hasCompressible = items.some((item) => item.packBehavior === "compressible");
  const hasToiletry = items.some((item) => item.category === "accessories");

  if (!overallFits) {
    advice.push("Your selected items may not fit well in this suitcase.");
  }

  if (!volumeFits) {
    advice.push("Try removing bulky items like jackets, hoodies, or shoes.");
  }

  if (!weightFits) {
    advice.push("Your luggage may exceed the weight limit. Remove heavier items first.");
  }

  if (hasShoes) {
    advice.push("Place shoes at the bottom or edges of the suitcase.");
  }

  if (hasCompressible) {
    advice.push("Use socks and underwear to fill empty corners.");
  }

  if (hasToiletry) {
    advice.push("Keep toiletries near the top for easier access.");
  }

  advice.push("Pack heavier items first and lighter items on top.");

  return advice;
};

const calculatePacking = (req, res) => {
  const { suitcaseId, selectedItems } = req.body;

  if (!suitcaseId || !selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const suitcaseQuery = "SELECT * FROM suitcases WHERE id = ?";
  const itemIds = selectedItems.map((item) => item.itemId);
  const itemsQuery = "SELECT * FROM items WHERE id IN (?)";
  const sizesQuery = "SELECT * FROM size_multipliers";

  db.query(suitcaseQuery, [suitcaseId], (suitcaseErr, suitcaseResults) => {
    if (suitcaseErr) {
      console.error("Error fetching suitcase:", suitcaseErr.message);
      return res.status(500).json({ message: "Server error" });
    }

    if (suitcaseResults.length === 0) {
      return res.status(404).json({ message: "Suitcase not found" });
    }

    const suitcase = suitcaseResults[0];

    db.query(itemsQuery, [itemIds], (itemsErr, itemsResults) => {
      if (itemsErr) {
        console.error("Error fetching items:", itemsErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      db.query(sizesQuery, (sizesErr, sizeResults) => {
        if (sizesErr) {
          console.error("Error fetching size multipliers:", sizesErr.message);
          return res.status(500).json({ message: "Server error" });
        }

        const sizeMap = {};
        sizeResults.forEach((size) => {
          sizeMap[size.size_code] = Number(size.multiplier);
        });

        let totalVolumeCm3 = 0;
        let totalWeightG = 0;

        const detailedItems = selectedItems.map((selected) => {
          const dbItem = itemsResults.find((item) => item.id === selected.itemId);

          if (!dbItem) {
            return null;
          }

          let sizeMultiplier = 1;

          if (dbItem.size_mode === "alpha" && selected.size && sizeMap[selected.size]) {
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
          };
        }).filter(Boolean);

        const weightKg = Number((totalWeightG / 1000).toFixed(2));
        const usedCapacityPercent = Number(((totalVolumeCm3 / suitcase.volume_cm3) * 100).toFixed(2));
        const remainingVolumeCm3 = Math.max(0, suitcase.volume_cm3 - totalVolumeCm3);

        const volumeFits = totalVolumeCm3 <= suitcase.volume_cm3;
        const weightFits = weightKg <= Number(suitcase.max_weight_kg);
        const overallFits = volumeFits && weightFits;

        const advice = getSimpleAdvice(detailedItems, overallFits, volumeFits, weightFits);

        return res.status(200).json({
          suitcase: {
            id: suitcase.id,
            name: suitcase.name,
            volumeCm3: suitcase.volume_cm3,
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
          items: detailedItems,
          advice,
        });
      });
    });
  });
};

module.exports = { calculatePacking };