const db = require("../config/db");

const getSavedSuitcases = (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT *
      FROM saved_suitcases
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Get saved suitcases error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      return res.status(200).json(results);
    });
  } catch (error) {
    console.error("Get saved suitcases catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const createSavedSuitcase = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      volumeCm3,
      maxWeightKg,
      lengthCm,
      widthCm,
      heightCm,
    } = req.body;

    if (!name || !volumeCm3 || !maxWeightKg) {
      return res.status(400).json({
        message: "Name, volumeCm3, and maxWeightKg are required",
      });
    }

    const query = `
      INSERT INTO saved_suitcases (
        user_id,
        name,
        volume_cm3,
        max_weight_kg,
        length_cm,
        width_cm,
        height_cm
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [
        userId,
        name,
        volumeCm3,
        maxWeightKg,
        lengthCm || null,
        widthCm || null,
        heightCm || null,
      ],
      (err, result) => {
        if (err) {
          console.error("Create saved suitcase error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }

        return res.status(201).json({
          message: "Saved suitcase created successfully",
          suitcaseId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Create saved suitcase catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateSavedSuitcase = (req, res) => {
  try {
    const userId = req.user.id;
    const suitcaseId = req.params.id;
    const {
      name,
      volumeCm3,
      maxWeightKg,
      lengthCm,
      widthCm,
      heightCm,
    } = req.body;

    const query = `
      UPDATE saved_suitcases
      SET
        name = ?,
        volume_cm3 = ?,
        max_weight_kg = ?,
        length_cm = ?,
        width_cm = ?,
        height_cm = ?
      WHERE id = ? AND user_id = ?
    `;

    db.query(
      query,
      [
        name,
        volumeCm3,
        maxWeightKg,
        lengthCm || null,
        widthCm || null,
        heightCm || null,
        suitcaseId,
        userId,
      ],
      (err, result) => {
        if (err) {
          console.error("Update saved suitcase error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Saved suitcase not found" });
        }

        return res.status(200).json({
          message: "Saved suitcase updated successfully",
        });
      }
    );
  } catch (error) {
    console.error("Update saved suitcase catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteSavedSuitcase = (req, res) => {
  try {
    const userId = req.user.id;
    const suitcaseId = req.params.id;

    const query = `
      DELETE FROM saved_suitcases
      WHERE id = ? AND user_id = ?
    `;

    db.query(query, [suitcaseId, userId], (err, result) => {
      if (err) {
        console.error("Delete saved suitcase error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Saved suitcase not found" });
      }

      return res.status(200).json({
        message: "Saved suitcase deleted successfully",
      });
    });
  } catch (error) {
    console.error("Delete saved suitcase catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSavedSuitcases,
  createSavedSuitcase,
  updateSavedSuitcase,
  deleteSavedSuitcase,
};