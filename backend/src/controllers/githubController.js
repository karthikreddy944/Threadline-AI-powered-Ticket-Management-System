const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Organization = require("../models/Organization");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");
const { encryptText, decryptText } = require("../utils/crypto");
const { buildOAuthUrl, exchangeCodeForToken, getUser, listUserRepos } = require("../services/github/githubService");

function makeState(organizationId) { return jwt.sign({ organizationId: organizationId.toString(), nonce: crypto.randomBytes(24).toString("hex") }, process.env.JWT_SECRET, { expiresIn: "10m" }); }
function readState(state) { try { return jwt.verify(state, process.env.JWT_SECRET); } catch (_) { return null; } }

const getAuthUrl = asyncHandler(async (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) { res.status(503); throw new Error("GitHub integration is not configured on the server."); }
  return sendSuccess(res, 200, { url: buildOAuthUrl({ state: makeState(req.organizationId) }) });
});

const callback = asyncHandler(async (req, res) => {
  const state = readState(req.query.state);
  const frontend = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  if (!state?.organizationId || !req.query.code) return res.redirect(`${frontend}/admin?github=error`);
  const organization = await Organization.findById(state.organizationId).select("+github.accessTokenEnc");
  if (!organization) return res.redirect(`${frontend}/admin?github=error`);
  try {
    const { accessToken, scope } = await exchangeCodeForToken(req.query.code);
    const ghUser = await getUser(accessToken);
    Object.assign(organization.github || (organization.github = {}), {
      accessTokenEnc: encryptText(accessToken), providerUserId: String(ghUser.id), username: ghUser.login || "",
      scopes: String(scope || "").split(",").filter(Boolean), connectedAt: new Date(), owner: "", repoName: "", fullName: "", defaultBranch: "main", htmlUrl: ""
    });
    await organization.save();
    return res.redirect(`${frontend}/admin/settings?github=connected`);
  } catch (_) { return res.redirect(`${frontend}/admin/settings?github=error`); }
});

const status = asyncHandler(async (req, res) => {
  const g = req.organization?.github;
  return sendSuccess(res, 200, { connected: !!g?.providerUserId, username: g?.username || "", repository: g?.fullName ? { owner: g.owner, name: g.repoName, fullName: g.fullName, branch: g.defaultBranch, htmlUrl: g.htmlUrl } : null, connectedAt: g?.connectedAt || null });
});

const repos = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.organizationId).select("+github.accessTokenEnc");
  const token = organization?.github?.accessTokenEnc ? decryptText(organization.github.accessTokenEnc) : null;
  if (!token) { res.status(400); throw new Error("Connect GitHub before selecting a repository."); }
  return sendSuccess(res, 200, await listUserRepos(token));
});

const selectRepository = asyncHandler(async (req, res) => {
  const { owner, name } = req.body || {};
  if (!owner || !name) { res.status(400); throw new Error("owner and name are required"); }
  const organization = await Organization.findById(req.organizationId).select("+github.accessTokenEnc");
  const token = organization?.github?.accessTokenEnc ? decryptText(organization.github.accessTokenEnc) : null;
  if (!token) { res.status(400); throw new Error("Connect GitHub before selecting a repository."); }
  const available = await listUserRepos(token);
  const repo = available.find(r => r.owner?.toLowerCase() === owner.toLowerCase() && r.name.toLowerCase() === name.toLowerCase());
  if (!repo) { res.status(403); throw new Error("That repository is not available to your connected GitHub account."); }
  Object.assign(organization.github, { owner: repo.owner, repoName: repo.name, fullName: repo.fullName, defaultBranch: repo.defaultBranch, htmlUrl: repo.htmlUrl });
  await organization.save();
  return sendSuccess(res, 200, { repository: repo, connected: true, username: organization.github.username });
});

const disconnect = asyncHandler(async (req, res) => {
  await Organization.findByIdAndUpdate(req.organizationId, { $set: { github: null } });
  return sendSuccess(res, 200, { disconnected: true });
});

module.exports = { getAuthUrl, callback, status, repos, selectRepository, disconnect };
