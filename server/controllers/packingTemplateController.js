const db = require("../config/db");
const queryAsync = require("../utils/queryAsync");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { logTripActivity } = require("../utils/tripActivityLogger");

const getPackingTemplates = async (req, res) => {
  try {
    const userId = req.user.id;
  
    const templates = await queryAsync(
      `
      SELECT
        pt.*,
        COUNT(pti.id) AS item_count
        FROM packing_templates pt
        LEFT JOIN packing_template_items pti
        ON pti.template_id = pt.id
        WHERE pt.user_id = ?
        GROUP BY pt.id
        ORDER BY pt.created_at DESC
      `,
      [userId]
    );
  
    return successResponse(res, "Packing templates fetched successfully", templates);
    } catch (error) {
      console.error("Get packing templates error:", error.message);
      return res.status(500).json({ message: "Server error" });
    }
};

const getPackingTemplateById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const templates = await queryAsync(
      `
      SELECT *
      FROM packing_templates
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (templates.length === 0) {
      return res.status(404).json({ message: "Packing template not found" });
    }

    const template = templates[0];

    const items = await queryAsync(
      `
      SELECT
        pti.*,
        i.name AS base_item_name
      FROM packing_template_items pti
      LEFT JOIN items i ON pti.item_id = i.id
      WHERE pti.template_id = ?
      ORDER BY pti.created_at ASC
      `,
      [id]
    );

    return successResponse(res, "Packing template fetched successfully", {
      template,
      items,
    });

  } catch (error) {
    console.error("Get packing template by id error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const createPackingTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      travelType,
      weatherType,
      travelerCount,
      notes,
      items = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Template name is required" });
    }

    const templateResult = await queryAsync(
      `
      INSERT INTO packing_templates (
        user_id,
        name,
        travel_type,
        weather_type,
        traveler_count,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        name,
        travelType || "casual",
        weatherType || "mixed",
        travelerCount || 1,
        notes || null,
      ]
    );

    const templateId = templateResult.insertId;

    for (const item of items) {
      await queryAsync(
        `
        INSERT INTO packing_template_items (
          template_id,
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
        `,
        [
          templateId,
          item.itemId || null,
          item.customName || null,
          item.sourceType,
          item.quantity || 1,
          item.sizeCode || null,
          item.category || null,
          item.audience || "unisex",
          item.baseVolumeCm3,
          item.baseWeightG,
          item.packBehavior,
        ]
      );
    }

  return successResponse(
    res,
    "Packing template created successfully",
    { templateId },
    201
  );
  } catch (error) {
    console.error("Create packing template error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const updatePackingTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      name,
      travelType,
      weatherType,
      travelerCount,
      notes,
      items = [],
    } = req.body;

    const existing = await queryAsync(
      `
      SELECT id
      FROM packing_templates
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Packing template not found" });
    }

    await queryAsync(
      `
      UPDATE packing_templates
      SET
        name = ?,
        travel_type = ?,
        weather_type = ?,
        traveler_count = ?,
        notes = ?
      WHERE id = ? AND user_id = ?
      `,
      [
        name,
        travelType || "casual",
        weatherType || "mixed",
        travelerCount || 1,
        notes || null,
        id,
        userId,
      ]
    );

    await queryAsync(
      `DELETE FROM packing_template_items WHERE template_id = ?`,
      [id]
    );

    for (const item of items) {
      await queryAsync(
        `
        INSERT INTO packing_template_items (
          template_id,
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
        `,
        [
          id,
          item.itemId || null,
          item.customName || null,
          item.sourceType,
          item.quantity || 1,
          item.sizeCode || null,
          item.category || null,
          item.audience || "unisex",
          item.baseVolumeCm3,
          item.baseWeightG,
          item.packBehavior,
        ]
      );
    }

    return successResponse(res, "Packing template updated successfully");

  } catch (error) {
    console.error("Update packing template error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const deletePackingTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await queryAsync(
      `
      DELETE FROM packing_templates
      WHERE id = ? AND user_id = ?
      `,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Packing template not found" });
    }

return successResponse(res, "Packing template deleted successfully");

  } catch (error) {
    console.error("Delete packing template error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

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

const applyTemplateToTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId, templateId } = req.params;

    const { replaceExisting, replaceExistingItems } = req.body || {};
    const shouldReplace = !!(replaceExisting || replaceExistingItems);

    const trip = await getOwnedTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const templates = await queryAsync(
      `
      SELECT *
      FROM packing_templates
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [templateId, userId]
    );

    if (templates.length === 0) {
      return res.status(404).json({ message: "Packing template not found" });
    }

    const existingTripItems = await queryAsync(
      `
      SELECT id
      FROM trip_items
      WHERE trip_id = ?
      LIMIT 1
      `,
      [tripId]
    );

    if (existingTripItems.length > 0 && !shouldReplace) {
      return res.status(409).json({
        message:
          "This trip already has items. Clear them first or apply the template in replace mode.",
      });
    }
    
    if (existingTripItems.length > 0 && shouldReplace) {
      await queryAsync(
        `
        DELETE FROM trip_items
        WHERE trip_id = ?
        `,
        [tripId]
      );
    }

    const templateItems = await queryAsync(
      `
      SELECT *
      FROM packing_template_items
      WHERE template_id = ?
      ORDER BY created_at ASC
      `,
      [templateId]
    );

    if (templateItems.length === 0) {
      return res.status(400).json({
        message: "This template has no items to apply.",
      });
    }

    for (const item of templateItems) {
      await queryAsync(
        `
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
        `,
        [
          tripId,
          item.item_id || null,
          item.custom_name || null,
          item.source_type,
          item.quantity || 1,
          item.size_code || null,
          item.category || null,
          item.audience || "unisex",
          item.base_volume_cm3,
          item.base_weight_g,
          item.pack_behavior,
        ]
      );
    }

    await logTripActivity({
      tripId,
      userId,
      eventType: "template_applied",
      title: "Template applied",
      details: `${templates[0].name} applied to this trip (${templateItems.length} items)`,
    });

    return successResponse(
      res,
      shouldReplace
        ? "Packing template replaced existing trip items successfully"
        : "Packing template applied successfully",
      {
        trip: {
          id: trip.id,
          tripName: trip.trip_name,
        },
        template: {
          id: templates[0].id,
          name: templates[0].name,
        },
        appliedItemsCount: templateItems.length,
        replacedExisting: shouldReplace,
      },
      201
    );
  } catch (error) {
    console.error("Apply template to trip error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const saveTripAsTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = req.params.tripId;
    const { name, description, travelType, weatherType } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Template name is required" });
    }

    const tripQuery = `
      SELECT *
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;

    db.query(tripQuery, [tripId, userId], (tripErr, tripRows) => {
      if (tripErr) {
        console.error("Save trip as template trip error:", tripErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (tripRows.length === 0) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const tripItemsQuery = `
        SELECT *
        FROM trip_items
        WHERE trip_id = ?
        ORDER BY created_at ASC
      `;

      db.query(tripItemsQuery, [tripId], (itemsErr, itemRows) => {
        if (itemsErr) {
          console.error("Save trip as template items error:", itemsErr.message);
          return res.status(500).json({ message: "Server error" });
        }

        if (itemRows.length === 0) {
          return res.status(400).json({
            message: "This trip has no items to save as template",
          });
        }

        const createTemplateQuery = `
          INSERT INTO packing_templates (
            user_id,
            name,
            travel_type,
            weather_type,
            notes
          )
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          createTemplateQuery,
          [
            userId,
            name.trim(),
            travelType || "casual",
            weatherType || "mixed",
            description || "",
          ],
          (templateErr, templateResult) => {
            if (templateErr) {
              console.error("Create template from trip error:", templateErr.message);
              return res.status(500).json({ message: "Server error" });
            }

            const templateId = templateResult.insertId;

            const values = itemRows.map((item) => [
              templateId,
              item.item_id || null,
              item.custom_name || null,
              item.source_type || "custom",
              item.quantity || 1,
              item.size_code || null,
              item.category || "custom",
              item.audience || "unisex",
              item.base_volume_cm3,
              item.base_weight_g,
              item.pack_behavior,
            ]);

            const insertTemplateItemsQuery = `
              INSERT INTO packing_template_items (
                template_id,
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
              VALUES ?
            `;

            db.query(insertTemplateItemsQuery, [values], (insertErr) => {
              if (insertErr) {
                console.error(
                  "Insert template items from trip error:",
                  insertErr.message
                );
                return res.status(500).json({ message: "Server error" });
              }
              logTripActivity({
                tripId,
                userId,
                eventType: "template_saved_from_trip",
                title: "Trip saved as template",
                details: `Saved as template "${name.trim()}"`,
              });

              return successResponse(
                res,
                "Trip saved as template successfully",
                { templateId },
                201
              );

            });
          }
        );
      });
    });
  } catch (error) {
    console.error("Save trip as template catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const bulkDeletePackingTemplates = async (req, res) => {
  try {
    const userId = req.user.id;
    const { templateIds } = req.body;

    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      return errorResponse(res, "templateIds array is required", 400);
    }

    for (const templateId of templateIds) {
      await queryAsync(
        `DELETE FROM packing_template_items WHERE template_id = ?`,
        [templateId]
      );

      await queryAsync(
        `DELETE FROM packing_templates WHERE id = ? AND user_id = ?`,
        [templateId, userId]
      );
    }

    return successResponse(res, "Selected templates deleted successfully");
    
  } catch (error) {
    console.error("Bulk delete packing templates error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getPackingTemplates,
  getPackingTemplateById,
  createPackingTemplate,
  updatePackingTemplate,
  deletePackingTemplate,
  applyTemplateToTrip,
  saveTripAsTemplate,
  bulkDeletePackingTemplates,
};