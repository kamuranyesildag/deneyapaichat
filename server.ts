import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Initialize Stripe lazily - REMOVED AS PER USER REQUEST
// Using generic payment verification for Google Pay API

app.use(express.json());

// API Routes
app.post("/api/verify-payment", async (req, res) => {
  const { tier, userEmail, paymentToken } = req.body;

  // In a real scenario, you would send this paymentToken to your gateway (e.g. PayTR, Iyzico)
  // For now, we simulate success since we are using Google Pay API directly
  console.log(`Payment received for ${tier} from ${userEmail}. Token:`, paymentToken);

  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ success: true, tier });
  } catch (error: any) {
    console.error("Payment Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
