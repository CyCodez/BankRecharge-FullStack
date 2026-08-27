const router = require("express").Router();
const { getDb } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const wallet = await getDb().collection("wallets").findOne({
      userId: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({ success: true, wallet });
  } catch (error) {
    console.error("GET /wallet error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load wallet.",
    });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const transactions = await getDb()
      .collection("transactions")
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return res.json({ success: true, transactions });
  } catch (error) {
    console.error("GET /wallet/transactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load transactions.",
    });
  }
});

router.post("/fund", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid amount of at least ₦100.",
      });
    }

    const db = getDb();
    const wallets = db.collection("wallets");
    const transactions = db.collection("transactions");

    // MongoDB driver v6 returns the updated document directly.
    // It does NOT return it inside `result.value`.
    const wallet = await wallets.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: { balance: amount },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    await transactions.insertOne({
      userId: req.user._id,
      type: "funding",
      direction: "credit",
      amount,
      description: "Wallet funding",
      status: "completed",
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Wallet funded successfully.",
      wallet,
    });
  } catch (error) {
    console.error("POST /wallet/fund error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fund wallet.",
    });
  }
});

module.exports = router;
