require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const walletRoutes = require("./routes/wallet.routes");
const rechargeRoutes = require("./routes/recharge.routes");

const app = express();

const PORT = Number(process.env.PORT) || 5000;

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  "http://localhost:5173",
  "https://bankrecharge.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an Origin header
    // e.g. Postman, curl, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(`Blocked CORS request from: ${origin}`);

    return callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  credentials: true,

  optionsSuccessStatus: 204,
};

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(cors(corsOptions));

app.use(express.json({ limit: "20kb" }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "BankRecharge API",
    database: "MongoDB",
    status: "healthy",
  });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/recharge", rechargeRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`BankRecharge API running on port ${PORT}`);
      console.log("Allowed CORS origins:");
      allowedOrigins.forEach((origin) => {
        console.log(`- ${origin}`);
      });
    });
  } catch (error) {
    console.error("Unable to start BankRecharge API:", error);

    process.exit(1);
  }
}

startServer();
