const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `API error: ${response.status}`)
  }
  return response.json()
}

export const api = {
  upload: {
    upload: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Upload failed")
      return response.json()
    },
    list: async () => fetchAPI("/resumes"),
    get: async (id: number) => fetchAPI(`/resumes/${id}`),
    delete: async (id: number) => fetchAPI(`/resumes/${id}`, { method: "DELETE" }),
  },
  
  extract: {
    extract: async (resumeId: number) => fetchAPI("/extract", {
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId }),
    }),
  },
  
  parse: {
    parse: async (resumeId: number) => fetchAPI("/parse", {
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId }),
    }),
    getParsed: async (resumeId: number) => fetchAPI(`/resumes/${resumeId}/parsed`),
  },
  
  keywords: {
    list: async () => fetchAPI("/keywords/all"),
    search: async (query: string) => fetchAPI(`/keywords?search=${encodeURIComponent(query)}`),
    create: async (keyword: string) => fetchAPI("/keywords", {
      method: "POST",
      body: JSON.stringify({ keyword }),
    }),
    update: async (keywords: string[]) => fetchAPI("/keywords", {
      method: "PUT",
      body: JSON.stringify({ keywords }),
    }),
    delete: async (id: number) => fetchAPI(`/keywords/${id}`, { method: "DELETE" }),
    getAll: async () => fetchAPI("/keywords/all"),
  },
  
  settings: {
    get: async () => fetchAPI("/settings"),
    update: async (data: object) => fetchAPI("/settings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  },
  
  jobs: {
    search: async (keywords: string, location: string, jobSources?: string[]) =>
      fetchAPI("/jobs/search", {
        method: "POST",
        body: JSON.stringify({ keywords, location, job_sources: jobSources }),
      }),
    list: async (params?: {
      source?: string;
      location?: string;
      date_from?: string;
      sort?: string;
      min_score?: number;
    }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return fetchAPI(`/jobs${query ? `?${query}` : ""}`);
    },
    get: async (id: number) => fetchAPI(`/jobs/${id}`),
    score: async (jobId: number) =>
      fetchAPI("/jobs/score", {
        method: "POST",
        body: JSON.stringify({ job_id: jobId }),
      }),
    scoreAll: async (jobIds?: number[]) =>
      fetchAPI("/jobs/score-all", {
        method: "POST",
        body: JSON.stringify({ job_ids: jobIds }),
      }),
  },
}