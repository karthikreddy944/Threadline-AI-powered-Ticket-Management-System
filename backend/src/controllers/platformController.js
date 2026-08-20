const Organization = require("../models/Organization");
const User = require("../models/User");
const PlatformSettings = require("../models/PlatformSettings");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");

const listAdministrators = asyncHandler(async (_req, res) => {
  const organizations = await Organization.find()
    .populate("adminUser", "name email createdAt isActive")
    .select("name adminCode adminUser subscription createdAt")
    .sort({ createdAt: -1 });
  const administrators = organizations.map((organization) => ({
    organizationId: organization._id,
    organizationName: organization.name,
    adminId: organization.adminUser?._id || null,
    adminName: organization.adminUser?.name || "Unknown administrator",
    adminEmail: organization.adminUser?.email || "",
    registeredAt: organization.createdAt,
    isActive: organization.adminUser?.isActive !== false,
    subscription: {
      status: organization.subscription?.status || "active",
      aiEnabled: organization.subscription?.aiEnabled !== false,
      updatedAt: organization.subscription?.updatedAt || organization.updatedAt,
    },
  }));
  return sendSuccess(res, 200, administrators);
});

const updateAdministratorAccess = asyncHandler(async (req, res) => {
  const { status, aiEnabled, isActive } = req.body || {};
  if (status !== undefined && !["active", "suspended"].includes(status)) { res.status(400); throw new Error("Subscription status must be active or suspended."); }
  if (aiEnabled !== undefined && typeof aiEnabled !== "boolean") { res.status(400); throw new Error("aiEnabled must be a boolean."); }
  if (isActive !== undefined && typeof isActive !== "boolean") { res.status(400); throw new Error("isActive must be a boolean."); }
  const organization = await Organization.findById(req.params.organizationId);
  if (!organization) { res.status(404); throw new Error("Organization not found."); }
  if (status !== undefined || aiEnabled !== undefined) {
    organization.subscription = {
      status: status === undefined ? organization.subscription?.status || "active" : status,
      aiEnabled: aiEnabled === undefined ? organization.subscription?.aiEnabled !== false : aiEnabled,
      updatedAt: new Date(),
    };
    await organization.save();
  }
  if (isActive !== undefined) await User.findByIdAndUpdate(organization.adminUser, { $set: { isActive } });
  return sendSuccess(res, 200, { updated: true });
});

const getAiSettings = asyncHandler(async (_req, res) => {
  const settings = await PlatformSettings.findOneAndUpdate({ key: "platform" }, { $setOnInsert: { key: "platform" } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return sendSuccess(res, 200, { enabled: settings.ai?.enabled !== false, codeAnalysisEnabled: settings.ai?.codeAnalysisEnabled !== false, repositoryAnalysisEnabled: settings.ai?.repositoryAnalysisEnabled !== false, provider: "Google Gemini", model: process.env.LLM_MODEL || "gemini-3.6-flash", configured: !!process.env.LLM_API_KEY });
});

const updateAiSettings = asyncHandler(async (req, res) => {
  const { enabled, codeAnalysisEnabled, repositoryAnalysisEnabled } = req.body || {};
  for (const value of [enabled, codeAnalysisEnabled, repositoryAnalysisEnabled]) {
    if (value !== undefined && typeof value !== "boolean") { res.status(400); throw new Error("AI settings must be boolean values."); }
  }
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: "platform" },
    { $setOnInsert: { key: "platform" }, $set: { ...(enabled !== undefined ? { "ai.enabled": enabled } : {}), ...(codeAnalysisEnabled !== undefined ? { "ai.codeAnalysisEnabled": codeAnalysisEnabled } : {}), ...(repositoryAnalysisEnabled !== undefined ? { "ai.repositoryAnalysisEnabled": repositoryAnalysisEnabled } : {}) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return sendSuccess(res, 200, settings.ai);
});

module.exports = { listAdministrators, updateAdministratorAccess, getAiSettings, updateAiSettings };
