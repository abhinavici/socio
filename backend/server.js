const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
    });

    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
