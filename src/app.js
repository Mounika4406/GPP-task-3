const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const healthRoutes = require("./routes/health.routes");
const pricingRoutes = require("./routes/pricing.routes");
const authMiddleware = require("./middleware/auth.middleware");
const releaseExpiredReservations = require("./jobs/releaseReservations.job");
const errorHandler = require("./middleware/error.middleware");
app.use(errorHandler);


setInterval(() => {
  releaseExpiredReservations().catch(console.error);
}, 60 * 1000);

app.use(authMiddleware);

app.use(pricingRoutes);


app.use(healthRoutes);


app.use(cors());
app.use(express.json());

module.exports = app;
