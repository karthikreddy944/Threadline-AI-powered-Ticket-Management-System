require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // exits process on failure, see src/config/db.js

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

startServer();

// Guard against unhandled promise rejections crashing the process silently
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err.message);
});
