const db = require("../config/db");
const { calculateTripResult } = require("../services/tripCalculationService");

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

const calculateTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const suitcasesQuery = `
    SELECT *
    FROM trip_suitcases
    WHERE trip_id = ?
    ORDER BY is_primary DESC, created_at ASC
  `;

    const tripItemsQuery = `
      SELECT
        ti.*,
        i.name AS base_item_name
      FROM trip_items ti
      LEFT JOIN items i ON ti.item_id = i.id
      WHERE ti.trip_id = ?
      ORDER BY ti.created_at ASC
    `;

    const sizesQuery = `
      SELECT *
      FROM size_multipliers
    `;

    db.query(suitcasesQuery, [tripId], (suitcaseErr, suitcaseResults) => {
      if (suitcaseErr) {
        console.error("Calculate trip suitcase error:", suitcaseErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (suitcaseResults.length === 0) {
        return res.status(400).json({
          message: "This trip has no suitcase assigned yet",
        });
      }
      
      const suitcases = suitcaseResults;

      db.query(tripItemsQuery, [tripId], (itemsErr, tripItemsResults) => {
        if (itemsErr) {
          console.error("Calculate trip items error:", itemsErr.message);
          return res.status(500).json({ message: "Server error" });
        }

        if (tripItemsResults.length === 0) {
          return res.status(400).json({
            message: "This trip has no items yet",
          });
        }

        db.query(sizesQuery, async (sizesErr, sizeResults) => {
          if (sizesErr) {
            console.error("Calculate trip sizes error:", sizesErr.message);
            return res.status(500).json({ message: "Server error" });
          }

          const profileRows = await new Promise((resolve, reject) => {
            db.query(
              `
              SELECT packing_mode
              FROM user_profiles
              WHERE user_id = ?
              LIMIT 1
              `,
              [userId],
              (err, results) => {
                if (err) return reject(err);
                resolve(results);
              }
            );
          });
          
          const userProfile = profileRows[0] || null;
          
          const calculated = calculateTripResult({
            suitcases,
            tripItems: tripItemsResults,
            sizeMultipliers: sizeResults,
            tripMeta: {
              weatherType: trip.weather_type,
              packingMode: userProfile?.packing_mode || "balanced",
            },
          });

          const upsertQuery = `
          INSERT INTO trip_results (
            trip_id,
            total_volume_cm3,
            total_weight_g,
            weight_kg,
            used_capacity_percent,
            remaining_volume_cm3,
            volume_fits,
            weight_fits,
            overall_fits,
            packing_order_json,
            layout_json,
            advice_json,
            smart_adjustments_json,
            bag_distribution_json,
            bag_rebalancing_suggestions_json,
            item_substitution_suggestions_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            total_volume_cm3 = VALUES(total_volume_cm3),
            total_weight_g = VALUES(total_weight_g),
            weight_kg = VALUES(weight_kg),
            used_capacity_percent = VALUES(used_capacity_percent),
            remaining_volume_cm3 = VALUES(remaining_volume_cm3),
            volume_fits = VALUES(volume_fits),
            weight_fits = VALUES(weight_fits),
            overall_fits = VALUES(overall_fits),
            packing_order_json = VALUES(packing_order_json),
            layout_json = VALUES(layout_json),
            advice_json = VALUES(advice_json),
            smart_adjustments_json = VALUES(smart_adjustments_json),
            bag_distribution_json = VALUES(bag_distribution_json),
            bag_rebalancing_suggestions_json = VALUES(bag_rebalancing_suggestions_json),
            item_substitution_suggestions_json = VALUES(item_substitution_suggestions_json),
            updated_at = CURRENT_TIMESTAMP
        `;

          db.query(
            upsertQuery,
            [
              tripId,
              calculated.totals.totalVolumeCm3,
              calculated.totals.totalWeightG,
              calculated.totals.weightKg,
              calculated.totals.usedCapacityPercent,
              calculated.totals.remainingVolumeCm3,
              calculated.totals.volumeFits,
              calculated.totals.weightFits,
              calculated.totals.overallFits,
              JSON.stringify(calculated.packingOrder),
              JSON.stringify(calculated.suitcaseLayout),
              JSON.stringify(calculated.advice),
              JSON.stringify(calculated.smartAdjustments),
              JSON.stringify(calculated.bagDistribution),
              JSON.stringify(calculated.bagRebalancingSuggestions),
              JSON.stringify(calculated.itemSubstitutionSuggestions),

            ],
            (saveErr) => {
              if (saveErr) {
                console.error("Save trip results error:", saveErr.message);
                return res.status(500).json({ message: "Server error" });
              }

              return res.status(200).json({
                message: "Trip calculated successfully",
                trip: {
                  id: trip.id,
                  tripName: trip.trip_name,
                  destination: trip.destination,
                },
                suitcases: suitcases.map((bag) => ({
                  id: bag.id,
                  name: bag.name,
                  bagRole: bag.bag_role,
                  isPrimary: !!bag.is_primary,
                  volumeCm3: Number(bag.volume_cm3),
                  maxWeightKg: Number(bag.max_weight_kg),
                })),

                totals: calculated.totals,
                items: calculated.items,
                packingOrder: calculated.packingOrder,
                suitcaseLayout: calculated.suitcaseLayout,
                advice: calculated.advice,
                smartAdjustments: calculated.smartAdjustments,
                bagDistribution: calculated.bagDistribution,
                bagRebalancingSuggestions: calculated.bagRebalancingSuggestions,
                itemSubstitutionSuggestions: calculated.itemSubstitutionSuggestions,
              });
            }
          );
        });
      });
    });
  } catch (error) {
    console.error("Calculate trip catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTripResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;


    const trip = await getOwnedTrip(tripId, userId);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    const suitcasesQuery = `
      SELECT *
      FROM trip_suitcases
      WHERE trip_id = ?
      ORDER BY is_primary DESC, created_at ASC
    `;

    const resultsQuery = `
      SELECT *
      FROM trip_results
      WHERE trip_id = ?
      LIMIT 1
    `;

    db.query(suitcasesQuery, [tripId], (suitcaseErr, suitcaseResults) => {
      if (suitcaseErr) {
        console.error("Get trip results suitcase error:", suitcaseErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      db.query(resultsQuery, [tripId], (resultErr, resultRows) => {
        if (resultErr) {
          console.error("Get trip results error:", resultErr.message);
          return res.status(500).json({ message: "Server error" });
        }

        if (resultRows.length === 0) {
          return res.status(404).json({
            message: "No calculation results found for this trip",
          });
        }

        const result = resultRows[0];
        const parseMaybeJson = (value, fallback) => {
          if (!value) return fallback;
          if (typeof value === "object") return value;
        
          try {
            return JSON.parse(value);
          } catch {
            return fallback;
          }
        };
 
        const packingOrder = parseMaybeJson(result.packing_order_json, []);
        const suitcaseLayout = parseMaybeJson(result.layout_json, {});
        const advice = parseMaybeJson(result.advice_json, []);
        const smartAdjustments = parseMaybeJson(result.smart_adjustments_json, {
          mainConstraint: "none",
          warnings: [],
          adjustments: [],
          optimizationTips: [],
        });
        const bagDistribution = parseMaybeJson(result.bag_distribution_json, []);
        const bagRebalancingSuggestions = parseMaybeJson(
          result.bag_rebalancing_suggestions_json,
          []
        );
        const itemSubstitutionSuggestions = parseMaybeJson(
          result.item_substitution_suggestions_json,
          []
        );

        return res.status(200).json({
          trip: {
            id: trip.id,
            tripName: trip.trip_name,
            destination: trip.destination,
          },
          suitcases: suitcaseResults.map((bag) => ({
            id: bag.id,
            name: bag.name,
            bagRole: bag.bag_role,
            isPrimary: !!bag.is_primary,
            volumeCm3: Number(bag.volume_cm3),
            maxWeightKg: Number(bag.max_weight_kg),
          })),
          totals: {
            totalVolumeCm3: result.total_volume_cm3,
            totalWeightG: result.total_weight_g,
            weightKg: Number(result.weight_kg),
            usedCapacityPercent: Number(result.used_capacity_percent),
            remainingVolumeCm3: result.remaining_volume_cm3,
            volumeFits: !!result.volume_fits,
            weightFits: !!result.weight_fits,
            overallFits: !!result.overall_fits,
            totalAvailableVolumeCm3: result.total_available_volume_cm3
              ? Number(result.total_available_volume_cm3)
              : null,
            totalAllowedWeightG: result.total_allowed_weight_g
              ? Number(result.total_allowed_weight_g)
              : null,
          },
          packingOrder,
          suitcaseLayout,
          advice,
          calculatedAt: result.calculated_at,
          smartAdjustments,
          bagDistribution,
          bagRebalancingSuggestions,
          itemSubstitutionSuggestions,
        });
      });
    });
  } catch (error) {
    console.error("Get trip results catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  calculateTrip,
  getTripResults,
};