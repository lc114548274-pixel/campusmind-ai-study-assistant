const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type Course = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  document_count: number;
};

export type DocumentItem = {
  id: number;
  course_id: number;
  file_name: string;
  status: string;
  page_count: number;
  chunk_count: number;
  error_message?: string | null;
  created_at: string;
};

export type ChatSource = {
  document_id: number;
  document_name: string;
  page: number;
  chunk_id: string;
  text?: string | null;
};

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("campusmind_token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("campusmind_token", token);
}

export function clearToken() {
  localStorage.removeItem("campusmind_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(detail.detail || "Request failed");
  }
  return response.json();
}

export const api = {
  register: (payload: { username: string; email: string; password: string }) =>
    request<{ access_token: string }>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  courses: () => request<Course[]>("/api/courses"),
  createCourse: (payload: { name: string; description?: string }) =>
    request<Course>("/api/courses", { method: "POST", body: JSON.stringify(payload) }),
  course: (id: string) => request<Course>(`/api/courses/${id}`),
  documents: (courseId: string) => request<DocumentItem[]>(`/api/courses/${courseId}/documents`),
  uploadDocument: (courseId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<DocumentItem>(`/api/courses/${courseId}/documents/upload`, { method: "POST", body: form });
  },
  chat: (courseId: string, payload: { question: string; language: string; session_id?: number }) =>
    request<{ answer: string; session_id: number; sources: ChatSource[] }>(`/api/courses/${courseId}/chat`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  summarize: (documentId: number, language: string, force = false) =>
    request<{ content: string }>(`/api/documents/${documentId}/summary`, {
      method: "POST",
      body: JSON.stringify({ language, force })
    }),
  quiz: (courseId: string, payload: { question_type: string; count: number; language: string }) =>
    request<{ content: string }>(`/api/courses/${courseId}/quiz`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  terms: (payload: { text: string; source_language: string; target_language: string }) =>
    request<{ content: string }>("/api/terms/translate", { method: "POST", body: JSON.stringify(payload) })
};
