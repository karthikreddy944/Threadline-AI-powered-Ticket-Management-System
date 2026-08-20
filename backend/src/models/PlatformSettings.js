const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: "platform" },
  ai: {
    enabled: { type: Boolean, default: true },
    codeAnalysisEnabled: { type: Boolean, default: true },
    repositoryAnalysisEnabled: { type: Boolean, default: true },
  },
}, { timestamps: true });

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
