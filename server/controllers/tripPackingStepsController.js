const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { buildPackingSteps } = require("../services/packingStepsEngine");
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

const generatePackingSteps = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const resultRows = await queryAsync(
      `
      SELECT *
      FROM trip_results
      WHERE trip_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (resultRows.length === 0) {
      return errorResponse(res, "Trip results not found. Calculate the trip first.", 400);
    }

    const rawResult = resultRows[0];

    const bagResults = rawResult.bag_results_json
      ? JSON.parse(rawResult.bag_results_json)
      : [];

    const travelDay = rawResult.travel_day_json
      ? JSON.parse(rawResult.travel_day_json)
      : {};

    const steps = buildPackingSteps({ bagResults, travelDay });

    await queryAsync(`DELETE FROM trip_packing_steps WHERE trip_id = ?`, [id]);

    for (const step of steps) {
      await queryAsync(
        `
        INSERT INTO trip_packing_steps (
          trip_id,
          step_order,
          step_type,
          item_id,
          item_name,
          quantity,
          fold_type,
          target_bag_id,
          target_bag_name,
          target_zone,
          instruction_text,
          is_completed
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
        [
          id,
          step.stepOrder,
          step.stepType,
          step.itemId,
          step.itemName,
          step.quantity,
          step.foldType,
          step.targetBagId,
          step.targetBagName,
          step.targetZone,
          step.instructionText,
        ]
      );
    }

    await logTripActivity({
      tripId: id,
      userId,
      eventType: "packing_steps_generated",
      title: "Packing steps generated",
      details: `${steps.length} guided packing step${steps.length === 1 ? "" : "s"} were generated.`,
    });

    return successResponse(res, "Packing steps generated successfully", steps);
  } catch (error) {
    console.error("Generate packing steps error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const getPackingSteps = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const rows = await queryAsync(
      `
      SELECT *
      FROM trip_packing_steps
      WHERE trip_id = ?
      ORDER BY step_order ASC
      `,
      [id]
    );

    const steps = rows.map((row) => ({
      id: row.id,
      stepOrder: Number(row.step_order || 0),
      stepType: row.step_type,
      itemId: row.item_id,
      itemName: row.item_name,
      quantity: Number(row.quantity || 1),
      foldType: row.fold_type,
      targetBagId: row.target_bag_id,
      targetBagName: row.target_bag_name,
      targetZone: row.target_zone,
      instructionText: row.instruction_text,
      isCompleted: Number(row.is_completed) === 1,
      completedAt: row.completed_at,
    }));

    return successResponse(res, "Packing steps fetched successfully", steps);
  } catch (error) {
    console.error("Get packing steps error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

const completePackingStep = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, stepId } = req.params;

    const trip = await getOwnedTrip(id, userId);
    if (!trip) {
      return errorResponse(res, "Trip not found", 404);
    }

    const existingRows = await queryAsync(
      `
      SELECT *
      FROM trip_packing_steps
      WHERE id = ? AND trip_id = ?
      LIMIT 1
      `,
      [stepId, id]
    );

    if (existingRows.length === 0) {
      return errorResponse(res, "Packing step not found", 404);
    }

    await queryAsync(
      `
      UPDATE trip_packing_steps
      SET is_completed = 1, completed_at = NOW()
      WHERE id = ? AND trip_id = ?
      `,
      [stepId, id]
    );

    return successResponse(res, "Packing step completed successfully");
  } catch (error) {
    console.error("Complete packing step error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  generatePackingSteps,
  getPackingSteps,
  completePackingStep,
};