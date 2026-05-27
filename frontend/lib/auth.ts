const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

async function apiFetch(path: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: controller.signal,
      ...init,
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((data as { error?: string }).error ?? "Request failed") as Error & { code?: string; email?: string };
      err.code = (data as { code?: string }).code;
      err.email = (data as { email?: string }).email;
      throw err;
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) throw new Error("Request timed out");
    throw err;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const data = await apiFetch("/api/auth/me", undefined, 4000);
    return (data as { user: AuthUser }).user ?? null;
  } catch {
    return null;
  }
}

export async function authLogin(
  email: string,
  password: string,
  rememberMe = false
): Promise<AuthUser> {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
  return (data as { user: AuthUser }).user;
}

// Returns email — caller must redirect to /verify-email
export async function authSignup(
  username: string,
  email: string,
  password: string
): Promise<{ email: string }> {
  await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  }, 30000);
  return { email };
}

export async function verifyEmail(email: string, otp: string): Promise<AuthUser> {
  const data = await apiFetch("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  return (data as { user: AuthUser }).user;
}

export async function resendVerification(email: string): Promise<void> {
  await apiFetch("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<void> {
  await apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, newPassword }),
  });
}

export async function resendResetOtp(email: string): Promise<void> {
  await apiFetch("/api/auth/resend-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function authLogout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}
