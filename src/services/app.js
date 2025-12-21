const express = require("express");
const cors = require("cors");
require("dotenv").config();

const auth = require("../middleware/auth.middleware");
const errorHandler = require("../middleware/error.middleware");

const healthRoutes = require("../routes/health.routes");
const pricingRoutes = require("../routes/pricing.routes");
const cartRoutes = require("../routes/cart.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(auth);

app.use(healthRoutes);
app.use(pricingRoutes);
app.use(cartRoutes);

app.use(errorHandler);

module.exports = app;
