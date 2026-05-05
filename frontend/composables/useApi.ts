export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase
  const token = useState<string | null>("auth_token", () => null)
  const { language } = useLang()

  async function request<T>(path: string, options: Record<string, any> = {}) {
    try {
      const headers = {
        ...(options.headers || {}),
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
      }
      return await $fetch<T>(path, { baseURL, ...options, headers })
    } catch (error: any) {
      const message = error?.data?.message || error?.message || "حدث خطأ غير متوقع"
      throw new Error(message)
    }
  }

  function formatMoney(value: number | null | undefined) {
    return new Intl.NumberFormat(language.value === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0))
  }

  return { request, formatMoney }
}
