require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const walletRoutes = require("./routes/wallet.routes");
const rechargeRoutes = require("./routes/recharge.routes");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "BankRecharge API",
    database: "MongoDB",
    status: "healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/recharge", rechargeRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`BankRecharge API running on port ${PORT}`);
      console.log(`Client allowed from: ${CLIENT_URL}`);
    });
  } catch (error) {
    console.error("Unable to start BankRecharge API:", error);
    process.exit(1);
  }
}

startServer();
