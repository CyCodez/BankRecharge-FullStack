const router = require("express").Router();
const { getDb } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

const NETWORKS = new Set(["MTN", "Airtel", "Glo", "9mobile"]);

function isValidPhone(phone) {
  return /^(?:0|234)(?:7|8|9)\d{8,9}$/.test(phone);
}

router.post("/", async (req, res) => {
  try {
    const { serviceType, network, phone } = req.body;
    const amount = Number(req.body.amount);

    if (!['airtime', 'data'].includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: "Choose either airtime or data.",
      });
    }

    if (!NETWORKS.has(network)) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid network.",
      });
    }

    if (!phone || !isValidPhone(phone.replace(/\s+/g, ""))) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Nigerian phone number.",
      });
    }

    if (!Number.isFinite(amount) || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Recharge amount must be at least ₦100.",
      });
    }

    const db = getDb();
    const wallets = db.collection("wallets");
    const recharges = db.collection("recharges");
    const transactions = db.collection("transactions");

    // The balance condition makes the debit atomic: two requests cannot
    // both spend money that is not available.
    const wallet = await wallets.findOneAndUpdate(
      {
        userId: req.user._id,
        balance: { $gte: amount },
      },
      {
        $inc: { balance: -amount },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const now = new Date();
    const cleanPhone = phone.replace(/\s+/g, "");

    await recharges.insertOne({
      userId: req.user._id,
      serviceType,
      network,
      phone: cleanPhone,
      amount,
      status: "completed",
      createdAt: now,
    });

    await transactions.insertOne({
      userId: req.user._id,
      type: serviceType,
      direction: "debit",
      amount,
      description: `${serviceType === "airtime" ? "Airtime" : "Data"} recharge to ${cleanPhone}`,
      status: "completed",
      metadata: { network, phone: cleanPhone },
      createdAt: now,
    });

    return res.status(201).json({
      success: true,
      message: `${serviceType === "airtime" ? "Airtime" : "Data"} recharge completed successfully.`,
      wallet,
    });
  } catch (error) {
    console.error("POST /recharge error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete recharge.",
    });
  }
});

module.exports = router;
