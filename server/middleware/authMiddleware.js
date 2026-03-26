const jwt = require("jsonwebtoken");
const db = require("../config/db");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const query = `
      SELECT id, first_name, last_name, email
      FROM users
      WHERE id = ?
    `;

    db.query(query, [decoded.id], (err, results) => {
      if (err) {
        console.error("Protect middleware DB error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      const user = results[0];

      req.user = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      };

      next();
    });
  } catch (error) {
    console.error("Protect middleware error:", error.message);
    return res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};

module.exports = { protect };