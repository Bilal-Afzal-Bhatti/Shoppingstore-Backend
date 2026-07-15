import dotenv from 'dotenv';
import path from 'path';

// 1. Configure dotenv FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 2. Import app AFTER variables are loaded
import app from "./app.js";

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
  // Add this line to verify your key is actually loading
  console.log("Stripe Key Loaded:", process.env.STRIPE_SECRET_KEY ? "Yes" : "No");
});