const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI from environment variables.
 * The server should not start if this connection fails, so we
 * exit the process on failure rather than letting the app run
 * without a database.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not defined in the environment (.env file).");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
