const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password by default
    },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, default: null },
    role: {
      type: String,
      enum: ["client", "admin", "employee", "superadmin"],
      default: "client",
    },
    employeeId: { type: String, trim: true, default: "" },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    // Job title / support role shown on the Admin > Employees page
    // (e.g. "Support Engineer"). Only meaningful for role: "employee".
    employeeRole: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    lastAssignedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
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
  },
  { timestamps: true }
);

// Hash password before saving, only if it was modified
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare a plain password with the hashed one
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
