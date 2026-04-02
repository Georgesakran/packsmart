const db = require("../config/db");
const { buildSuggestionRules } = require("../services/tripSuggestionService");

const getOwnedTrip = (tripId, userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;

    db.query(query, [tripId, userId], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return resolve(null);
      resolve(results[0]);
    });
  });
};

const queryAsync = (query, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const generateSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const existingItems = await queryAsync(
      `
      SELECT id
      FROM trip_items
      WHERE trip_id = ?
      LIMIT 1
      `,
      [tripId]
    );

    if (existingItems.length > 0) {
      return res.status(409).json({
        message:
          "This trip already has items. Clear them first before generating suggestions.",
      });
    }

    const profileRows = await queryAsync(
      `
        SELECT
          default_size,
          travel_style,
          preferred_suitcase_name,
          packing_mode
        FROM user_profiles
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    const userProfile = profileRows[0] || null;

    const suggestedRules = buildSuggestionRules({
      durationDays: trip.duration_days,
      travelType: trip.travel_type,
      weatherType: trip.weather_type,
      travelerCount: trip.traveler_count,
      defaultSize: userProfile?.default_size || "M",
      travelStyle: userProfile?.travel_style || "casual",
      packingMode: userProfile?.packing_mode || "balanced",
    });

    if (!suggestedRules.length) {
      return res.status(400).json({
        message: "No suggestions could be generated for this trip.",
      });
    }

    const itemNames = suggestedRules.map((item) => item.name);

    const dbItems = await queryAsync(
      `
      SELECT *
      FROM items
      WHERE name IN (?)
      `,
      [itemNames]
    );

    if (!dbItems.length) {
      return res.status(404).json({
        message: "Suggested base items were not found in items table.",
      });
    }

    const insertedItems = [];

    for (const suggested of suggestedRules) {
      const baseItem = dbItems.find((dbItem) => dbItem.name === suggested.name);

      if (!baseItem) continue;

      const insertQuery = `
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
          pack_behavior
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const sizeCode =
        baseItem.size_mode === "alpha" ? suggested.sizeCode || "M" : null;

      const result = await queryAsync(insertQuery, [
        tripId,
        baseItem.id,
        null,
        "database",
        suggested.quantity,
        sizeCode,
        baseItem.category,
        baseItem.audience,
        baseItem.base_volume_cm3,
        baseItem.base_weight_g,
        baseItem.pack_behavior,
      ]);

      insertedItems.push({
        tripItemId: result.insertId,
        itemId: baseItem.id,
        name: baseItem.name,
        quantity: suggested.quantity,
        sizeCode,
        category: baseItem.category,
        audience: baseItem.audience,
        baseVolumeCm3: baseItem.base_volume_cm3,
        baseWeightG: baseItem.base_weight_g,
        packBehavior: baseItem.pack_behavior,
      });
    }

    return res.status(201).json({
      message: "Trip suggestions generated successfully",
      trip: {
        id: trip.id,
        tripName: trip.trip_name,
        destination: trip.destination,
        durationDays: trip.duration_days,
        travelType: trip.travel_type,
        weatherType: trip.weather_type,
        travelerCount: trip.traveler_count,
      },
      profileUsed: {
        defaultSize: userProfile?.default_size || "M",
        travelStyle: userProfile?.travel_style || "casual",
        preferredSuitcaseName: userProfile?.preferred_suitcase_name || "",
        packingMode: userProfile?.packing_mode || "balanced",
      },
      suggestions: insertedItems,
    });
  } catch (error) {
    console.error("Generate suggestions error:", error.message);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = { generateSuggestions };