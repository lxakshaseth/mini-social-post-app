const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || "";

async function apiRequest(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const timeoutMs = options.timeout || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your internet connection.");
    }
    throw err;
  }
}

export function getImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  return FILE_BASE_URL ? `${FILE_BASE_URL}${imagePath}` : imagePath;
}

export function fetchPosts() {
  return apiRequest("/posts");
}

export function signupUser(payload) {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(token) {
  return apiRequest("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateUserProfile(payload, token) {
  return apiRequest("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function createPost(body, token) {
  return apiRequest("/posts", {
    method: "POST",
    body,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function toggleLikeOnPost(postId, token) {
  return apiRequest(`/posts/${postId}/like`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function votePoll(postId, optionIndex, token) {
  return apiRequest(`/posts/${postId}/vote`, {
    method: "POST",
    body: JSON.stringify({ optionIndex }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function togglePinPost(postId, token) {
  return apiRequest(`/posts/${postId}/pin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function toggleBookmarkPost(postId, token) {
  return apiRequest(`/posts/${postId}/bookmark`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSavedPosts(token) {
  return apiRequest("/posts/saved", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function addComment(postId, text, token) {
  return apiRequest(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function deleteComment(postId, commentId, token) {
  return apiRequest(`/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function toggleLikeComment(postId, commentId, token) {
  return apiRequest(`/posts/${postId}/comments/${commentId}/like`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updatePost(postId, text, token) {
  return apiRequest(`/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify({ text }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function deletePost(postId, token) {
  return apiRequest(`/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function fetchSupportBrief(payload) {
  return apiRequest("/assistant/support-brief", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestSupportChat(payload) {
  return apiRequest("/assistant/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchSystemDiagnostics() {
  return apiRequest("/system/diagnostics");
}

