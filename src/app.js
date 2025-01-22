// Libs
const express = require("express");
// Config
const cors = require("cors");
require("dotenv").config();
// Routes
const walletRoutes = require("./routes/walletRoutes");

// Initialize express app (JSON, CORS)
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/wallet", walletRoutes);

// Middleware for resigtering requests
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
