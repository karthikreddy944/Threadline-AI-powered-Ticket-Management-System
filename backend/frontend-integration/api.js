/**
 * Reusable API utility for the existing React frontend.
 *
 * HOW TO USE:
 * Copy this file to: frontend/ticket-system/src/lib/api.js
 * (do not overwrite anything else — this is a new file)
 *
 * Then in your components, replace the mock-data imports with calls like:
 *   import { getMyTickets, createTicket, login } from "../lib/api";
 *
 * Set VITE_API_URL in a .env file inside frontend/ticket-system if you
 * want to override the default http://localhost:5000/api
 */

const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "ticket_system_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${response.status})`);
  }

  return json.data;
}

// ---- Auth ----
export const registerUser = (payload) =>
  request("/auth/register", { method: "POST", body: payload, auth: false });

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password }, auth: false });

// ---- Users ----
export const getCurrentUser = () => request("/users/me");
export const getUsers = () => request("/users");

// ---- Tickets ----
export const createTicket = (payload) =>
  request("/tickets", { method: "POST", body: payload });

export const getMyTickets = () => request("/tickets/my");

export const getTicketById = (id) => request(`/tickets/${id}`);

export const getAllTickets = (query = {}) => {
  const params = new URLSearchParams(query).toString();
  return request(`/tickets${params ? `?${params}` : ""}`);
};

export const updateTicket = (id, payload) =>
  request(`/tickets/${id}`, { method: "PUT", body: payload });

export const addTicketActivity = (id, message) =>
  request(`/tickets/${id}/activity`, { method: "POST", body: { message } });

export const getTicketActivity = (id) => request(`/tickets/${id}/activity`);

export const getTicketStats = () => request("/tickets/stats");
