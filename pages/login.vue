<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuth()
const { t } = useLang()
const status = ref("")
const loading = ref(false)
const form = ref({
  email: "",
  password: ""
})

await auth.initAuth()
if (auth.user.value) {
  await navigateTo(auth.user.value.role === "admin" ? "/" : "/portal")
}

async function submit() {
  status.value = ""
  loading.value = true
  try {
    const user = await auth.login(form.value.email, form.value.password)
    await navigateTo(user.role === "admin" ? "/" : "/portal")
  } catch (error: any) {
    const message = String(error?.message || "")
    if (message.toLowerCase().includes("route not found") || message.includes("404")) {
      status.value = t("auth.backend_missing")
    } else {
      status.value = message
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-wrap">
    <section class="auth-shell">
      <aside class="auth-side">
        <div class="auth-lang-row">
          <LanguageToggle />
        </div>
        <h1>{{ t("auth.crm_system") }}</h1>
        <p>{{ t("auth.manage_all") }}</p>
        <ul>
          <li>{{ t("auth.admin_controls") }}</li>
          <li>{{ t("auth.customer_tracks") }}</li>
          <li>{{ t("auth.history") }}</li>
        </ul>
      </aside>

      <section class="panel auth-card">
        <h2>{{ t("auth.login") }}</h2>
        <p class="subtitle">{{ t("auth.enter_details") }}</p>

        <form class="form-grid" @submit.prevent="submit">
          <label class="wide">
            {{ t("auth.email") }}
            <input v-model="form.email" type="email" required />
          </label>
          <label class="wide">
            {{ t("auth.password") }}
            <input v-model="form.password" type="password" required />
          </label>
          <div class="wide actions auth-actions">
            <NuxtLink to="/register" class="auth-link-btn">{{ t("auth.create_account") }}</NuxtLink>
            <button type="submit" :disabled="loading">{{ loading ? t("auth.loading") : t("auth.login") }}</button>
          </div>
        </form>

        <p v-if="status" class="status status-error">{{ status }}</p>
        <p class="status">{{ t("auth.default_admin") }}: admin@crm.local / admin123</p>
      </section>
    </section>
  </main>
</template>
