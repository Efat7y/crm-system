<script setup lang="ts">
definePageMeta({ layout: false })

const auth = useAuth()
const { t } = useLang()
const status = ref("")
const loading = ref(false)
const form = ref({
  name: "",
  email: "",
  phone: "",
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
    await auth.register(form.value.name, form.value.email, form.value.password, form.value.phone)
    status.value = t("register.created")
    await navigateTo("/login")
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
        <h1>{{ t("register.new_customer") }}</h1>
        <p>{{ t("register.follow_prices") }}</p>
      </aside>

      <section class="panel auth-card">
        <h2>{{ t("register.create_account") }}</h2>
        <p class="subtitle">{{ t("register.saved_in_dashboard") }}</p>

        <form class="form-grid" @submit.prevent="submit">
          <label class="wide">
            {{ t("register.full_name") }}
            <input v-model="form.name" required />
          </label>
          <label>
            {{ t("auth.email") }}
            <input v-model="form.email" type="email" required />
          </label>
          <label>
            {{ t("register.phone") }}
            <input v-model="form.phone" />
          </label>
          <label class="wide">
            {{ t("auth.password") }}
            <input v-model="form.password" type="password" minlength="6" required />
          </label>
          <div class="wide actions auth-actions">
            <NuxtLink to="/login" class="auth-link-btn">{{ t("register.back_to_login") }}</NuxtLink>
            <button type="submit" :disabled="loading">{{ loading ? t("auth.loading") : t("register.create_account") }}</button>
          </div>
        </form>

        <p v-if="status" class="status status-error">{{ status }}</p>
      </section>
    </section>
  </main>
</template>
