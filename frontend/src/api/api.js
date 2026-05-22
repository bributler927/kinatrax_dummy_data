const API_BASE_URL = "http://localhost:8000";

export async function fetchJson(path, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  const url = queryString
    ? `${API_BASE_URL}${path}?${queryString}`
    : `${API_BASE_URL}${path}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${path} failed with status ${response.status}`);
  }

  return response.json();
}

export function getYearComparison(params) {
  return fetchJson("/api/analytics/year-comparison", params);
}

export function getPitchTrends(params) {
  return fetchJson("/api/analytics/trends", params);
}

export function getAnalyticsMetrics() {
  return fetchJson("/api/analytics/metrics");
}