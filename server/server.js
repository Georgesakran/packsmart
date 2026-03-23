const express = require ("express");
const cors = require ("cors");
const dotenv = require ("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("PackSmart API is running");
});

const suitcaseRoutes = require("./routes/suitcaseRoutes");
const itemRoutes = require("./routes/itemRoutes");
const sizeRoutes = require("./routes/sizeRoutes");
const calculateRoutes = require("./routes/calculateRoutes");

app.use("/api/suitcases", suitcaseRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/size-multipliers", sizeRoutes);
app.use("/api/calculate", calculateRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server Running On PORT ${PORT}`);
});
