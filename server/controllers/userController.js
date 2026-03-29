const db = require("../config/db");

const getProfile = (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        up.gender,
        up.default_size,
        up.travel_style,
        up.preferred_suitcase_name,
        up.notes
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?
      LIMIT 1
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Get profile error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const profile = results[0];

      return res.status(200).json({
        user: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
        },
        profile: {
          gender: profile.gender || "",
          defaultSize: profile.default_size || "",
          travelStyle: profile.travel_style || "casual",
          preferredSuitcaseName: profile.preferred_suitcase_name || "",
          notes: profile.notes || "",
        },
      });
    });
  } catch (error) {
    console.error("Get profile catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      gender,
      defaultSize,
      travelStyle,
      preferredSuitcaseName,
      notes,
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        message: "First name and last name are required",
      });
    }

    const updateUserQuery = `
      UPDATE users
      SET first_name = ?, last_name = ?
      WHERE id = ?
    `;

    db.query(updateUserQuery, [firstName, lastName, userId], (userErr) => {
      if (userErr) {
        console.error("Update user basic info error:", userErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      const checkProfileQuery = `
        SELECT id
        FROM user_profiles
        WHERE user_id = ?
        LIMIT 1
      `;

      db.query(checkProfileQuery, [userId], (checkErr, checkResults) => {
        if (checkErr) {
          console.error("Check profile error:", checkErr.message);
          return res.status(500).json({ message: "Server error" });
        }

        if (checkResults.length > 0) {
          const updateProfileQuery = `
            UPDATE user_profiles
            SET
              gender = ?,
              default_size = ?,
              travel_style = ?,
              preferred_suitcase_name = ?,
              notes = ?
            WHERE user_id = ?
          `;

          db.query(
            updateProfileQuery,
            [
              gender || null,
              defaultSize || null,
              travelStyle || "casual",
              preferredSuitcaseName || null,
              notes || null,
              userId,
            ],
            (profileErr) => {
              if (profileErr) {
                console.error("Update profile error:", profileErr.message);
                return res.status(500).json({ message: "Server error" });
              }

              return res.status(200).json({
                message: "Profile updated successfully",
              });
            }
          );
        } else {
          const insertProfileQuery = `
            INSERT INTO user_profiles (
              user_id,
              gender,
              default_size,
              travel_style,
              preferred_suitcase_name,
              notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          db.query(
            insertProfileQuery,
            [
              userId,
              gender || null,
              defaultSize || null,
              travelStyle || "casual",
              preferredSuitcaseName || null,
              notes || null,
            ],
            (insertErr) => {
              if (insertErr) {
                console.error("Insert profile error:", insertErr.message);
                return res.status(500).json({ message: "Server error" });
              }

              return res.status(200).json({
                message: "Profile updated successfully",
              });
            }
          );
        }
      });
    });
  } catch (error) {
    console.error("Update profile catch error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};