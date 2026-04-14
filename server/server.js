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
const userRoutes = require("./routes/userRoutes");
const savedSuitcaseRoutes = require("./routes/savedSuitcaseRoutes");
const packingTemplateRoutes = require("./routes/packingTemplateRoutes");
const airlineRoutes = require("./routes/airlineRoutes");
const bagRoutes = require("./routes/bagRoutes");
const tripBagRecommendationRoutes = require("./routes/tripBagRecommendationRoutes");
const tripItemSuggestionRoutes = require("./routes/tripItemSuggestionRoutes");
const tripPackingStepsRoutes = require("./routes/tripPackingStepsRoutes");
const customItemRoutes = require("./routes/customItemRoutes");
const travelPresetRoutes = require("./routes/travelPresetRoutes");
const notificationPreferenceRoutes = require("./routes/notificationPreferenceRoutes");
const tripReminderRoutes = require("./routes/tripReminderRoutes");
const tripSimulationRoutes = require("./routes/tripSimulationRoutes");



app.use("/api", notificationPreferenceRoutes);
app.use("/api", tripReminderRoutes);
app.use("/api/airlines", airlineRoutes);
app.use("/api/suitcases", suitcaseRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/custom-items", customItemRoutes);
app.use("/api/size-multipliers", sizeRoutes);
app.use("/api/calculate", calculateRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/trips", tripSuitcaseRoutes);
app.use("/api/trips", tripItemRoutes);
app.use("/api/trips", tripCalculationRoutes);
app.use("/api/trips", tripSuggestionRoutes);
app.use("/api/trips", tripBagRecommendationRoutes);
app.use("/api/trips", tripItemSuggestionRoutes);
app.use("/api/trips", tripPackingStepsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/saved-suitcases", savedSuitcaseRoutes);
app.use("/api/packing-templates", packingTemplateRoutes);
app.use("/api/bags", bagRoutes);
app.use("/api", travelPresetRoutes);
app.use("/api", tripSimulationRoutes);



const PORT = process.env.PORT || 5000;

const errorMiddleware = require("./middleware/errorMiddleware");
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});