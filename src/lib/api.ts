// Base URL for the backend API (env first, then same-origin /api)
const API_URL = (() => {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw && raw.trim()) return `${raw.replace(/\/$/, "")}/api`;
  return "/api";
})();

export async function getGestures() {
  const res = await fetch(`${API_URL}/gestures`);
  if (!res.ok) throw new Error("Failed to fetch gestures");
  return res.json();
}

export async function createGesture(data: { name: string; category: string; difficulty: string; status: string }) {
  const res = await fetch(`${API_URL}/gestures`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create gesture");
  return res.json();
}

function _adminHeaders(): HeadersInit {
  const token = localStorage.getItem("ksl_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getUsers() {
  const res = await fetch(`${API_URL}/users`, { headers: _adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getUserById(id: string) {
  const res = await fetch(`${API_URL}/users/${id}`, { headers: _adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function inviteUser(data: { name: string; email: string; role: string }) {
  const res = await fetch(`${API_URL}/users/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to invite user");
  return res.json();
}

export async function updateUser(id: string, data: { role?: string; status?: string; profileCompletionRequested?: boolean }) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

export async function deleteUser(id: string) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function getLogs() {
  const res = await fetch(`${API_URL}/logs`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function getReportStats(range: "7d" | "30d" | "90d" = "30d") {
  const res = await fetch(`${API_URL}/reports/stats?range=${range}`);
  if (!res.ok) throw new Error("Failed to fetch report stats");
  return res.json();
}

export async function getRecentUsers() {
  const res = await fetch(`${API_URL}/reports/recent-users`);
  if (!res.ok) throw new Error("Failed to fetch recent users");
  return res.json();
}

export async function submitFeedback(data: { name: string; email: string; topic: string; message: string }) {
  const res = await fetch(`${API_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to submit feedback");
  }
  return res.json();
}

export async function getFeedbackList() {
  const res = await fetch(`${API_URL}/feedback`, { headers: _adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch feedback list");
  return res.json();
}
