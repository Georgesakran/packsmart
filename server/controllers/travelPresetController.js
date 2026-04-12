const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { logTripActivity } = require("../utils/tripActivityLogger");

const getOwnedTrip = async (tripId, userId) => {
  const rows = await queryAsync(
    `
    SELECT *
    FROM trips
    WHERE id = ? AND user_id = ?
    LIMIT 1
    `,
    [tripId, userId]
  );

  return rows[0] || null;
};

const getTravelPresets = async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await queryAsync(
      `
      SELECT *
      FROM travel_presets
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return successResponse(res, "Travel presets fetched successfully", rows);
  } catch (error) {
    console.error("Get travel presets error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const getTravelPresetById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const presetRows = await queryAsync(
      `
      SELECT *
      FROM travel_presets
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (presetRows.length === 0) {
      return errorResponse(res, "Travel preset not found", 404);
    }

    const preset = presetRows[0];

    const bags = await queryAsync(
      `
      SELECT *
      FROM travel_preset_bags
      WHERE preset_id = ?
      ORDER BY id ASC
      `,
      [id]
    );

    const items = await queryAsync(
      `
      SELECT *
      FROM travel_preset_items
      WHERE preset_id = ?
      ORDER BY id ASC
      `,
      [id]
    );

    return successResponse(res, "Travel preset fetched successfully", {
      preset,
      bags,
      items,
    });
  } catch (error) {
    console.error("Get travel preset by id error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const saveTripAsPreset = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      name,
      presetType = "full_trip",
      includeBags = true,
      includeItems = true,
      includeProfiles = true,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, "Preset name is required", 400);
    }

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const presetResult = await queryAsync(
      `
      INSERT INTO travel_presets (
        user_id,
        name,
        preset_type,
        trip_type,
        packing_mode,
        duration_days,
        traveler_count,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        name.trim(),
        presetType,
        trip.trip_type || trip.travel_type || null,
        trip.packing_mode || null,
        trip.duration_days || null,
        trip.traveler_count || 1,
        notes || null,
      ]
    );

    const presetId = presetResult.insertId;

    if (includeBags) {
      const tripBags = await queryAsync(
        `
        SELECT *
        FROM trip_suitcases
        WHERE trip_id = ?
        ORDER BY id ASC
        `,
        [id]
      );

      for (const bag of tripBags) {
        await queryAsync(
          `
          INSERT INTO travel_preset_bags (
            preset_id,
            bag_catalog_id,
            suitcase_type,
            name,
            volume_cm3,
            max_weight_kg,
            bag_role,
            quantity
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            presetId,
            bag.bag_catalog_id || null,
            bag.suitcase_type || null,
            bag.name || null,
            bag.volume_cm3 || null,
            bag.max_weight_kg || null,
            bag.bag_role || null,
            1,
          ]
        );
      }
    }

    if (includeItems) {
      const tripItems = await queryAsync(
        `
        SELECT *
        FROM trip_items
        WHERE trip_id = ?
        ORDER BY id ASC
        `,
        [id]
      );

      for (const item of tripItems) {
        await queryAsync(
          `
          INSERT INTO travel_preset_items (
            preset_id,
            item_id,
            custom_name,
            source_type,
            quantity,
            category,
            audience,
            size_code,
            fold_type,
            base_volume_cm3,
            base_weight_g,
            pack_behavior,
            travel_day_mode,
            packing_status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            presetId,
            item.item_id || null,
            item.custom_name || null,
            item.source_type,
            item.quantity || 1,
            item.category || null,
            item.audience || "unisex",
            includeProfiles ? item.size_code || null : null,
            includeProfiles ? item.fold_type || null : null,
            item.base_volume_cm3,
            item.base_weight_g,
            item.pack_behavior,
            item.travel_day_mode || "normal",
            "pending",
          ]
        );
      }
    }

    await logTripActivity({
      tripId: id,
      userId,
      eventType: "preset_saved",
      title: "Preset saved",
      details: `${name.trim()} was saved as a travel preset.`,
    });

    return successResponse(
      res,
      "Trip saved as preset successfully",
      { presetId },
      201
    );
  } catch (error) {
    console.error("Save trip as preset error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const applyPresetToTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, presetId } = req.params;
    const {
      replaceExistingBags = true,
      replaceExistingItems = true,
    } = req.body || {};

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const presetRows = await queryAsync(
      `
      SELECT *
      FROM travel_presets
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [presetId, userId]
    );

    if (presetRows.length === 0) {
      return errorResponse(res, "Travel preset not found", 404);
    }

    const presetBags = await queryAsync(
      `
      SELECT *
      FROM travel_preset_bags
      WHERE preset_id = ?
      ORDER BY id ASC
      `,
      [presetId]
    );

    const presetItems = await queryAsync(
      `
      SELECT *
      FROM travel_preset_items
      WHERE preset_id = ?
      ORDER BY id ASC
      `,
      [presetId]
    );

    if (replaceExistingBags) {
      await queryAsync(`DELETE FROM trip_suitcases WHERE trip_id = ?`, [id]);
    }

    if (replaceExistingItems) {
      await queryAsync(`DELETE FROM trip_items WHERE trip_id = ?`, [id]);
    }

    for (const bag of presetBags) {
      await queryAsync(
        `
        INSERT INTO trip_suitcases (
          trip_id,
          suitcase_type,
          name,
          volume_cm3,
          max_weight_kg,
          bag_role,
          is_primary
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          bag.suitcase_type || null,
          bag.name || null,
          bag.volume_cm3 || null,
          bag.max_weight_kg || null,
          bag.bag_role || null,
          0,
        ]
      );
    }

    for (const item of presetItems) {
      await queryAsync(
        `
        INSERT INTO trip_items (
          trip_id,
          item_id,
          custom_name,
          source_type,
          quantity,
          category,
          audience,
          size_code,
          fold_type,
          base_volume_cm3,
          base_weight_g,
          pack_behavior,
          travel_day_mode,
          packing_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          item.item_id || null,
          item.custom_name || null,
          item.source_type,
          item.quantity || 1,
          item.category || null,
          item.audience || "unisex",
          item.size_code || null,
          item.fold_type || null,
          item.base_volume_cm3,
          item.base_weight_g,
          item.pack_behavior,
          item.travel_day_mode || "normal",
          "pending",
        ]
      );
    }

    await logTripActivity({
      tripId: id,
      userId,
      eventType: "preset_applied",
      title: "Preset applied",
      details: `${presetRows[0].name} was applied to this trip.`,
    });

    return successResponse(res, "Travel preset applied successfully", {
      appliedBagsCount: presetBags.length,
      appliedItemsCount: presetItems.length,
    });
  } catch (error) {
    console.error("Apply preset to trip error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const deleteTravelPreset = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const presetRows = await queryAsync(
      `
      SELECT *
      FROM travel_presets
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (presetRows.length === 0) {
      return errorResponse(res, "Travel preset not found", 404);
    }

    await queryAsync(`DELETE FROM travel_preset_bags WHERE preset_id = ?`, [id]);
    await queryAsync(`DELETE FROM travel_preset_items WHERE preset_id = ?`, [id]);
    await queryAsync(`DELETE FROM travel_presets WHERE id = ? AND user_id = ?`, [id, userId]);

    return successResponse(res, "Travel preset deleted successfully");
  } catch (error) {
    console.error("Delete travel preset error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const createTripFromPreset = async (req, res) => {
    try {
      const userId = req.user.id;
      const { presetId } = req.params;
      const {
        tripName,
        destination,
        startDate,
        endDate,
        durationDays,
        travelType,
        weatherType,
        travelerCount,
        notes,
        status,
      } = req.body;
  
      if (!tripName || !tripName.trim()) {
        return errorResponse(res, "Trip name is required", 400);
      }
  
      const presetRows = await queryAsync(
        `
        SELECT *
        FROM travel_presets
        WHERE id = ? AND user_id = ?
        LIMIT 1
        `,
        [presetId, userId]
      );
  
      if (presetRows.length === 0) {
        return errorResponse(res, "Travel preset not found", 404);
      }
  
      const preset = presetRows[0];
  
      const presetBags = await queryAsync(
        `
        SELECT *
        FROM travel_preset_bags
        WHERE preset_id = ?
        ORDER BY id ASC
        `,
        [presetId]
      );
  
      const presetItems = await queryAsync(
        `
        SELECT *
        FROM travel_preset_items
        WHERE preset_id = ?
        ORDER BY id ASC
        `,
        [presetId]
      );
  
      const tripInsertResult = await queryAsync(
        `
        INSERT INTO trips (
          user_id,
          trip_name,
          destination,
          start_date,
          end_date,
          duration_days,
          travel_type,
          weather_type,
          traveler_count,
          notes,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          tripName.trim(),
          destination || null,
          startDate || null,
          endDate || null,
          durationDays || preset.duration_days || null,
          travelType || preset.trip_type || "casual",
          weatherType || "mixed",
          travelerCount || preset.traveler_count || 1,
          notes || preset.notes || null,
          status || "draft",
        ]
      );
  
      const newTripId = tripInsertResult.insertId;
  
      for (const bag of presetBags) {
        await queryAsync(
          `
          INSERT INTO trip_suitcases (
            trip_id,
            suitcase_type,
            name,
            volume_cm3,
            max_weight_kg,
            bag_role,
            is_primary
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            newTripId,
            bag.suitcase_type || null,
            bag.name || null,
            bag.volume_cm3 || null,
            bag.max_weight_kg || null,
            bag.bag_role || null,
            0,
          ]
        );
      }
  
      for (const item of presetItems) {
        await queryAsync(
          `
          INSERT INTO trip_items (
            trip_id,
            item_id,
            custom_name,
            source_type,
            quantity,
            category,
            audience,
            size_code,
            fold_type,
            base_volume_cm3,
            base_weight_g,
            pack_behavior,
            travel_day_mode,
            packing_status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            newTripId,
            item.item_id || null,
            item.custom_name || null,
            item.source_type,
            item.quantity || 1,
            item.category || null,
            item.audience || "unisex",
            item.size_code || null,
            item.fold_type || null,
            item.base_volume_cm3,
            item.base_weight_g,
            item.pack_behavior,
            item.travel_day_mode || "normal",
            "pending",
          ]
        );
      }
  
      return successResponse(
        res,
        "Trip created from preset successfully",
        { tripId: newTripId },
        201
      );
    } catch (error) {
      console.error("Create trip from preset error:", error.message);
      return errorResponse(res, "Server error", 500);
    }
  };

module.exports = {
  getTravelPresets,
  getTravelPresetById,
  saveTripAsPreset,
  applyPresetToTrip,
  deleteTravelPreset,
  createTripFromPreset,
};