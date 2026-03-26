const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const checkUserQuery = "SELECT * FROM users WHERE email = ?";

    db.query(checkUserQuery, [email], async (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Register check user error:", checkErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          message: "Email already in use",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertUserQuery = `
        INSERT INTO users (first_name, last_name, email, password_hash)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertUserQuery,
        [firstName, lastName, email, hashedPassword],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Register insert user error:", insertErr.message);
            return res.status(500).json({ message: "Server error" });
          }

          const newUser = {
            id: insertResult.insertId,
            first_name: firstName,
            last_name: lastName,
            email,
          };

          const token = generateToken({
            id: newUser.id,
            email: newUser.email,
          });

          return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
              id: newUser.id,
              firstName: newUser.first_name,
              lastName: newUser.last_name,
              email: newUser.email,
            },
          });
        }
      );
    });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const findUserQuery = "SELECT * FROM users WHERE email = ?";

    db.query(findUserQuery, [email], async (findErr, results) => {
      if (findErr) {
        console.error("Login find user error:", findErr.message);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
      });

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getMe = (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  getMe,
};