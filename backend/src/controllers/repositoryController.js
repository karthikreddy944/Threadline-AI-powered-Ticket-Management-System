const Organization = require("../models/Organization");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");
const { decryptText } = require("../utils/crypto");
const { getRepoTree, getFile, updateFileContent, GitHubServiceError } = require("../services/github/githubService");
const { shouldIgnore, isAnalyzable } = require("../services/github/repoFileSelector");
const { MAX_SOURCE_FILE_BYTES } = require("../config/githubPolicy");

const validPath = (filePath) => typeof filePath === "string" && filePath.length > 0 && filePath.length <= 500 && !filePath.startsWith("/") && !filePath.split("/").some((part) => !part || part === "." || part === "..");

async function connectedRepository(organizationId) {
  const organization = await Organization.findById(organizationId).select("+github.accessTokenEnc");
  const github = organization?.github;
  if (!github?.fullName || !github?.owner || !github?.repoName || !github?.accessTokenEnc) {
    const error = new Error("The administrator has not connected a GitHub repository for this organization.");
    error.statusCode = 400;
    throw error;
  }
  try {
    return {
      token: decryptText(github.accessTokenEnc),
      repository: { owner: github.owner, name: github.repoName, fullName: github.fullName, branch: github.defaultBranch || "main", htmlUrl: github.htmlUrl || "" },
    };
  } catch (_) {
    const error = new Error("The organization's GitHub connection could not be unlocked. Ask an administrator to reconnect GitHub.");
    error.statusCode = 400;
    throw error;
  }
}

function rethrowGitHub(error) {
  if (error instanceof GitHubServiceError) {
    error.statusCode = error.status || 502;
  }
  throw error;
}

const getRepository = asyncHandler(async (req, res) => {
  const { repository } = await connectedRepository(req.organizationId);
  return sendSuccess(res, 200, { repository });
});

const listFiles = asyncHandler(async (req, res) => {
  const { token, repository } = await connectedRepository(req.organizationId);
  let tree;
  try { tree = await getRepoTree(token, repository.owner, repository.name, repository.branch); } catch (error) { rethrowGitHub(error); }
  const files = (tree?.tree || [])
    .filter((entry) => entry?.type === "blob" && entry.path && !shouldIgnore(entry.path) && isAnalyzable(entry.path) && (!entry.size || entry.size <= MAX_SOURCE_FILE_BYTES))
    .map((entry) => ({ path: entry.path, size: entry.size || 0 }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return sendSuccess(res, 200, { repository, files, truncated: !!tree?.truncated });
});

const readFile = asyncHandler(async (req, res) => {
  const filePath = req.query.path;
  if (!validPath(filePath) || !isAnalyzable(filePath) || shouldIgnore(filePath)) { res.status(400); throw new Error("Choose a supported source file from the connected repository."); }
  const { token, repository } = await connectedRepository(req.organizationId);
  let file;
  try { file = await getFile(token, repository.owner, repository.name, filePath, repository.branch); } catch (error) { rethrowGitHub(error); }
  if (!file || Array.isArray(file) || file.type !== "file" || !file.sha || file.encoding !== "base64") { res.status(400); throw new Error("This repository item cannot be edited as a source file."); }
  const content = Buffer.from(String(file.content || "").replace(/\n/g, ""), "base64").toString("utf8");
  if (Buffer.byteLength(content, "utf8") > MAX_SOURCE_FILE_BYTES) { res.status(400); throw new Error("This file is too large to edit here."); }
  return sendSuccess(res, 200, { repository, path: filePath, sha: file.sha, content });
});

const saveFile = asyncHandler(async (req, res) => {
  const { path, content, sha, message } = req.body || {};
  if (!validPath(path) || !isAnalyzable(path) || shouldIgnore(path)) { res.status(400); throw new Error("Choose a supported source file from the connected repository."); }
  if (typeof content !== "string" || Buffer.byteLength(content, "utf8") > MAX_SOURCE_FILE_BYTES) { res.status(400); throw new Error("Source content is required and must be 200 KB or less."); }
  if (typeof sha !== "string" || !sha) { res.status(400); throw new Error("Reload the file before saving so GitHub can protect against overwriting newer changes."); }
  const { token, repository } = await connectedRepository(req.organizationId);
  let result;
  try { result = await updateFileContent(token, repository.owner, repository.name, path, { content, sha, branch: repository.branch, message: typeof message === "string" && message.trim() ? message.trim().slice(0, 200) : `Update ${path} from Threadline` }); } catch (error) { rethrowGitHub(error); }
  return sendSuccess(res, 200, { repository, path, sha: result?.content?.sha || null, commitUrl: result?.commit?.html_url || null });
});

module.exports = { getRepository, listFiles, readFile, saveFile };
