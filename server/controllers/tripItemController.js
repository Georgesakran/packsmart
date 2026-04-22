const db = require("../config/db");
const queryAsync = require("../utils/queryAsync");
const { logTripActivity } = require("../utils/tripActivityLogger");
const { getTripItemDisplayName } = require("../utils/tripItemName");
const { successResponse, errorResponse } = require("../utils/apiResponse");


const getOwnedTrip = (tripId, userId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT *
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [tripId, userId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] || null);
      }
    );
  });
};

const createTripItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const {
      itemId,
      customName,
      sourceType,
      quantity,
      sizeCode,
      category,
      audience,
      baseVolumeCm3,
      baseWeightG,
      packBehavior,
      assignedBagId,
    } = req.body;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    if (!sourceType || quantity == null || Number(quantity) < 1 || !packBehavior) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }
    
    if (sourceType === "database" && !itemId) {
      return res.status(400).json({
        message: "itemId is required for database items",
      });
    }
    
    if (sourceType === "custom" && !customName) {
      return res.status(400).json({
        message: "customName is required for custom items",
      });
    }
    
    const normalizedBaseVolumeCm3 =
    baseVolumeCm3 == null ? 0 : Number(baseVolumeCm3);
  
    const normalizedBaseWeightG =
    baseWeightG == null ? 0 : Number(baseWeightG);
    
    if (
      Number.isNaN(normalizedBaseVolumeCm3) ||
      Number.isNaN(normalizedBaseWeightG) ||
      normalizedBaseVolumeCm3 < 0 ||
      normalizedBaseWeightG < 0
    ) {
      return res.status(400).json({
        message: "Invalid volume or weight values",
      });
    }    
    const query = `
    INSERT INTO trip_items (
      trip_id,
      item_id,
      custom_name,
      source_type,
      quantity,
      size_code,
      category,
      audience,
      base_volume_cm3,
      base_weight_g,
      pack_behavior,
      assigned_bag_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    db.query(
      query,
      [
        tripId,
        itemId || null,
        customName || null,
        sourceType,
        quantity,
        sizeCode || null,
        category || null,
        audience || null,
        normalizedBaseVolumeCm3,
        normalizedBaseWeightG,
        packBehavior,
        assignedBagId || null,
      ],
      (err, result) => {
        if (err) {
          console.error("Create trip item error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }

        const itemName = customName || (sourceType === "database" ? `Item #${itemId}` : "Custom item");

        logTripActivity({
          tripId,
          userId,
          eventType: "item_added",
          title: "Item added",
          details: `${itemName} was added to this trip.`,
        }).catch((logError) => {
          console.error("Trip activity log error:", logError.message);
        });

        return res.status(201).json({
          message: "Trip item created successfully",
          tripItemId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Create trip item catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTripItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const query = `
    SELECT
      ti.*,
      i.name AS base_item_name,
      ts.name AS assigned_bag_name,
      ts.bag_role AS assigned_bag_role,
      ts.suitcase_type AS assigned_bag_type
    FROM trip_items ti
    LEFT JOIN items i ON ti.item_id = i.id
    LEFT JOIN trip_suitcases ts ON ti.assigned_bag_id = ts.id
    WHERE ti.trip_id = ?
    ORDER BY ti.created_at ASC
  `;

    db.query(query, [tripId], (err, results) => {
      if (err) {
        console.error("Get trip items error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }
      
        const mappedItems = results.map((item) => ({
          ...item,
          displayName: item.custom_name || item.base_item_name || "Custom Item",
          quantity: Number(item.quantity || 1),
          packingStatus: item.packing_status || "pending",
          travelDayMode: item.travel_day_mode || "normal",
          sizeCode: item.size_code || null,
          foldType: item.fold_type || null,
          assignedBagName: item.assigned_bag_name || null,
          assignedBagRole: item.assigned_bag_role || null,
          assignedBagType: item.assigned_bag_type || null,
        }));

        return successResponse(res, "Trip items fetched successfully", mappedItems);
        
    });
  } catch (error) {
    console.error("Get trip items catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateTripItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const tripItemId = req.params.tripItemId;

    const {
      itemId,
      customName,
      sourceType,
      quantity,
      sizeCode,
      category,
      audience,
      baseVolumeCm3,
      baseWeightG,
      packBehavior,
      assignedBagId,
    } = req.body;

    

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const query = `
      UPDATE trip_items
      SET
        item_id = ?,
        custom_name = ?,
        source_type = ?,
        quantity = ?,
        size_code = ?,
        category = ?,
        audience = ?,
        base_volume_cm3 = ?,
        base_weight_g = ?,
        pack_behavior = ?,
        assigned_bag_id = ?
      WHERE id = ? AND trip_id = ?
    `;

    db.query(
      query,
      [
        itemId || null,
        customName || null,
        sourceType,
        quantity,
        sizeCode || null,
        category || null,
        audience || null,
        baseVolumeCm3,
        baseWeightG,
        packBehavior,
        assignedBagId || null,
        tripItemId,
        tripId,
      ],
      (err, result) => {
        if (err) {
          console.error("Update trip item error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }
    
        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Trip item not found",
          });
        }
    
        return res.status(200).json({
          message: "Trip item updated successfully",
        });
      }
    );
  } catch (error) {
    console.error("Update trip item catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteTripItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const tripItemId = req.params.tripItemId;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }
    const itemRows = await queryAsync(
      `
      SELECT *
      FROM trip_items
      WHERE id = ? AND trip_id = ?
      LIMIT 1
      `,
      [tripItemId, tripId]
    );
    
    if (itemRows.length === 0) {
      return res.status(404).json({ message: "Trip item not found" });
    }

    const query = `
      DELETE FROM trip_items
      WHERE id = ? AND trip_id = ?
    `;

    db.query(query, [tripItemId, tripId], (err, result) => {
      if (err) {
        console.error("Delete trip item error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Trip item not found",
        });
      }
      logTripActivity({
        tripId,
        userId,
        eventType: "item_removed",
        title: "Item removed",
        details: `${itemRows[0].custom_name || "Item"} was removed from this trip.`,
      });

      return res.status(200).json({
        message: "Trip item deleted successfully",
      });
    });
  } catch (error) {
    console.error("Delete trip item catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTripItem,
  getTripItems,
  updateTripItem,
  deleteTripItem,
};