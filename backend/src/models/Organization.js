const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Organization name is required"], trim: true },
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    adminCode: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    github: {
      accessTokenEnc: { type: String, select: false },
      providerUserId: { type: String, default: null },
      username: { type: String, default: "" },
      owner: { type: String, default: "" },
      repoName: { type: String, default: "" },
      fullName: { type: String, default: "" },
      defaultBranch: { type: String, default: "main" },
      htmlUrl: { type: String, default: "" },
      scopes: { type: [String], default: [] },
      connectedAt: { type: Date, default: null },
    },
    subscription: {
      status: { type: String, enum: ["active", "suspended"], default: "active" },
      aiEnabled: { type: Boolean, default: true },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
