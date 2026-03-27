const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
require("./config/db");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("PackSmart API is running");
});

const suitcaseRoutes = require("./routes/suitcaseRoutes");
const itemRoutes = require("./routes/itemRoutes");
const sizeRoutes = require("./routes/sizeRoutes");
const calculateRoutes = require("./routes/calculateRoutes");
const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");
const tripSuitcaseRoutes = require("./routes/tripSuitcaseRoutes");
const tripItemRoutes = require("./routes/tripItemRoutes");
const tripCalculationRoutes = require("./routes/tripCalculationRoutes");
const tripSuggestionRoutes = require("./routes/tripSuggestionRoutes");

// app.use("/api/suitcases", suitcaseRoutes);
// app.use("/api/items", itemRoutes);
app.use("/api/size-multipliers", sizeRoutes);
app.use("/api/calculate", calculateRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/trips", tripSuitcaseRoutes);
app.use("/api/trips", tripItemRoutes);
app.use("/api/trips", tripCalculationRoutes);
app.use("/api/trips", tripSuggestionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});