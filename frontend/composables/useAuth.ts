type AuthUser = {
  id: number
  name: string
  email: string
  role: "admin" | "customer"
  customer_id: number | null
}

export function useAuth() {
  const { request } = useApi()
  const token = useState<string | null>("auth_token", () => null)
  const user = useState<AuthUser | null>("auth_user", () => null)
  const initialized = useState<boolean>("auth_initialized", () => false)
  const tokenCookie = useCookie<string | null>("crm_token", {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  })

  function syncTokenStorage() {
    tokenCookie.value = token.value

    if (process.server) return

    if (token.value) {
      localStorage.setItem("crm_token", token.value)
    } else {
      localStorage.removeItem("crm_token")
    }
  }

  function restoreToken() {
    if (token.value) return

    if (tokenCookie.value) {
      token.value = tokenCookie.value
      return
    }

    if (!process.server) {
      const saved = localStorage.getItem("crm_token")
      if (saved) {
        token.value = saved
        tokenCookie.value = saved
      }
    }
  }

  async function initAuth() {
    restoreToken()

    if (!token.value) {
      initialized.value = true
      user.value = null
      syncTokenStorage()
      return
    }

    if (initialized.value && user.value) return

    initialized.value = true

    try {
      user.value = await request<AuthUser>("/auth/me")
    } catch {
      token.value = null
      user.value = null
    }
    syncTokenStorage()
  }

  async function login(email: string, password: string) {
    const data = await request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: { email, password }
    })
    token.value = data.token
    user.value = data.user
    initialized.value = true
    syncTokenStorage()
    return data.user
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    await request("/auth/register", {
      method: "POST",
      body: { name, email, password, phone }
    })
  }

  async function logout() {
    try {
      if (token.value) {
        await request("/auth/logout", { method: "POST" })
      }
    } catch {}
    token.value = null
    user.value = null
    initialized.value = true
    syncTokenStorage()
  }

  return {
    token,
    user,
    initAuth,
    login,
    register,
    logout
  }
}
