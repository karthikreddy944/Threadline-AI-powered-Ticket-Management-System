/**
 * Reusable API client for the Express backend.
 *
 * Base URL comes from VITE_API_URL (see .env), falling back to
 * http://localhost:5000/api for local development.
 *
 * Every function here returns the `data` portion of the backend's
 * { success, data } envelope, or throws an ApiError with a `.status`
 * so callers/UI can branch on 401 / 403 / 404 / 400 / 500 / network.
 */

const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "ticket_system_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status; // e.g. 401, 403, 404, 400, 500, or 0 for network errors
  }
}

// Called by AuthContext so a 401 on any authenticated request can
// clear the session in one place instead of every page handling it.
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

async function request(path, { method = "GET", body, auth = true } = {}) {
  // FormData (file uploads) must NOT be JSON-stringified, and must NOT get
  // an explicit Content-Type — the browser sets multipart/form-data with
  // the correct boundary on its own.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = isFormData ? {} : { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (networkError) {
    throw new ApiError("Network error — is the backend running?", 0);
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    if (response.status === 401 && auth && && !path.startsWith("/github/")) {
      unauthorizedHandler?.();
    }
    throw new ApiError(json.message || `Request failed (${response.status})`, response.status);
  }

  return json.data;
}

// ---- Auth ----
export const registerUser = (payload) =>
  request("/auth/register", { method: "POST", body: payload, auth: false });

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password }, auth: false });

export const registerAdmin = (payload) => request("/auth/admin/register", { method: "POST", body: payload, auth: false });
export const getOrganization = () => request("/organization");
export const getPlatformAdministrators = () => request("/platform/administrators");
export const updatePlatformAdministrator = (organizationId, payload) => request(`/platform/administrators/${organizationId}`, { method: "PATCH", body: payload });
export const getPlatformAiSettings = () => request("/platform/ai-settings");
export const updatePlatformAiSettings = (payload) => request("/platform/ai-settings", { method: "PATCH", body: payload });
export const getClients = (query = {}) => { const params = new URLSearchParams(query).toString(); return request(`/organization/clients${params ? `?${params}` : ""}`); };
export const getClientDetails = (id) => request(`/organization/clients/${id}`);

// ---- Users ----
export const getCurrentUser = () => request("/users/me");
export const getUsers = (query = {}) => {
  const params = new URLSearchParams(query).toString();
  return request(`/users${params ? `?${params}` : ""}`);
};

// ---- Tickets ----
export const createTicket = (payload) => request("/tickets", { method: "POST", body: payload });

export const getMyTickets = () => request("/tickets/my");

export const getTicketById = (id) => request(`/tickets/${id}`);

export const getAllTickets = (query = {}) => {
  const params = new URLSearchParams(query).toString();
  return request(`/tickets${params ? `?${params}` : ""}`);
};

export const updateTicket = (id, payload) => request(`/tickets/${id}`, { method: "PUT", body: payload });

export const addTicketActivity = (id, message) =>
  request(`/tickets/${id}/activity`, { method: "POST", body: { message } });

export const getTicketActivity = (id) => request(`/tickets/${id}/activity`);

export const getTicketStats = () => request("/tickets/stats");
export const getTicketAnalytics = (days = 7) => request(`/tickets/analytics?days=${days}`);
export const getEscalatedTickets = () => request("/tickets/escalated");
// Employee-only. Escalates a ticket assigned to the logged-in employee
// back to Admin. `reason` is required by the backend.
export const escalateTicket = (id, reason) =>
  request(`/tickets/${id}/escalate`, { method: "POST", body: { reason } });
export const getEmployeeTickets = (query = {}) => { const params = new URLSearchParams(query).toString(); return request(`/tickets/employee${params ? `?${params}` : ""}`); };
export const getEmployeeStats = () => request("/tickets/employee/stats");
export const getAllocationSettings = () => request("/allocation");
export const updateAllocationSettings = (payload) => request("/allocation", { method: "PUT", body: payload });
// Automatic assignment — only succeeds server-side when Assignment Mode is "automatic".
export const autoAssignTicket = (ticketId) => request(`/allocation/assign/${ticketId}`, { method: "POST" });
export const autoAssignAllUnassigned = () => request("/allocation/assign-all", { method: "POST" });
export const getEmployees = (query = {}) => { const params = new URLSearchParams(query).toString(); return request(`/users/employees${params ? `?${params}` : ""}`); };
export const createEmployee = (payload) => request("/users/employees", { method: "POST", body: payload });
export const updateEmployee = (id, payload) => request(`/users/employees/${id}`, { method: "PUT", body: payload });
export const updateEmployeeStatus = (id, isActive) =>
  request(`/users/employees/${id}/status`, { method: "PATCH", body: { isActive } });
export const deleteEmployee = (id) => request(`/users/employees/${id}`, { method: "DELETE" });

// ---- Attachments ----
export const uploadTicketAttachments = (ticketId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return request(`/tickets/${ticketId}/attachments`, { method: "POST", body: formData });
};

export const getTicketAttachments = (ticketId) => request(`/tickets/${ticketId}/attachments`);

export const deleteTicketAttachment = (ticketId, attachmentId) =>
  request(`/tickets/${ticketId}/attachments/${attachmentId}`, { method: "DELETE" });

// ---- AI Engine (A.E.) — admins and the employee assigned to the ticket ----
// Both resolve to { status: "ok" | "no_code_attachment" | "not_analyzed", message, analysis }
export const analyzeTicketCode = (ticketId) =>
  request(`/tickets/${ticketId}/ai/analyze`, { method: "POST" });

export const getTicketAiAnalysis = (ticketId) => request(`/tickets/${ticketId}/ai`);
export const analyzeTicketRepository = (ticketId) => request(`/tickets/${ticketId}/ai/analyze-repo`, { method: "POST" });
export const getTicketRepoAnalysis = (ticketId) => request(`/tickets/${ticketId}/ai/repo`);

export const getGitHubAuthUrl = () => request("/github/auth-url");
export const getGitHubStatus = () => request("/github/status");
export const getGitHubRepos = () => request("/github/repos");
export const selectGitHubRepository = (owner, name) => request("/github/repository", { method: "POST", body: { owner, name } });
export const disconnectGitHub = () => request("/github/connection", { method: "DELETE" });
export const getConnectedRepository = () => request("/github/repository/current");
export const getRepositoryFiles = () => request("/github/repository/files");
export const getRepositoryFile = (path) => request(`/github/repository/file?path=${encodeURIComponent(path)}`);
export const saveRepositoryFile = (payload) => request("/github/repository/file", { method: "PUT", body: payload });

// Recognizes GitHub authorization errors (expired/revoked token) coming
// back from any /github/* call, so the UI can offer "Reconnect GitHub"
// instead of a generic error message. A 401 from our API always means
// GitHub rejected the stored token; a 403 only counts if the message
// makes clear it's a credentials problem rather than e.g. a rate limit.
const GITHUB_AUTH_ERROR_PATTERNS = [
  /authorization has expired/i,
  /reconnect github/i,
  /unauthorized/i,
  /access token/i,
  /token expired/i,
];

export const isGitHubAuthError = (error) => {
  if (!error) return false;
  const message = error.message || "";
  if (error.status === 401) return true;
  if (error.status === 403 && /expired|revoked|invalid/i.test(message)) return true;
  return GITHUB_AUTH_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

// ---- Notifications ----
export const getNotifications = (query = {}) => {
  const params = new URLSearchParams(query).toString();
  return request(`/notifications${params ? `?${params}` : ""}`);
};
export const getUnreadNotificationCount = () => request("/notifications/unread-count");
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: "PUT" });
export const markAllNotificationsRead = () => request("/notifications/read-all", { method: "PUT" });


// Attachment downloads are protected by the same JWT as every other
// request, so a plain <a href="..."> can't carry the Authorization
// header. Fetch the file as a blob instead and hand back an object URL
// the caller can open in a new tab or feed to an <img>/download link.
// (Bypasses the JSON `request()` helper above since this response body
// is a file, not JSON.)
export const fetchAttachmentBlob = async (ticketId, attachmentId, { inline = false } = {}) => {
  const token = getToken();
  const qs = inline ? "?mode=inline" : "";
  let response;
  try {
    response = await fetch(`${BASE_URL}/tickets/${ticketId}/attachments/${attachmentId}${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (networkError) {
    throw new ApiError("Network error — is the backend running?", 0);
  }

  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler?.();
    throw new ApiError(`Couldn't load attachment (${response.status})`, response.status);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
