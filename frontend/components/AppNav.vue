<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const { t } = useLang()
const user = auth.user

const adminLinks = computed(() => [
  { to: "/", label: t("nav.dashboard") },
  { to: "/customers", label: t("nav.customers") },
  { to: "/catalogs", label: t("nav.all_sections") }
])

const sectionLinks = computed(() => [
  { to: "/sections/raw_material", label: t("nav.raw_materials") },
  { to: "/sections/fragrance", label: t("nav.fragrances") },
  { to: "/sections/color", label: t("nav.colors") }
])

const customerLinks = computed(() => [{ to: "/portal", label: t("nav.customer_portal") }])

function isLinkActive(to: string) {
  if (to === "/") {
    return route.path === "/" || route.path.startsWith("/orders/")
  }

  if (to === "/customers") {
    return route.path === "/customers" || route.path.startsWith("/customers/")
  }

  if (to === "/portal") {
    return route.path === "/portal" || route.path.startsWith("/portal/orders/")
  }

  return route.path === to
}

async function logout() {
  await auth.logout()
  await navigateTo("/login")
}
</script>

<template>
  <aside class="side-nav panel">
    <div class="side-top">
      <h2>ABE</h2>
      <LanguageToggle />
    </div>
    <p class="subtitle">{{ t("nav.welcome") }} {{ user?.name || t("nav.user") }}</p>

    <nav class="side-links">
      <template v-if="user?.role === 'admin'">
        <NuxtLink
          v-for="link in adminLinks"
          :key="link.to"
          :to="link.to"
          class="side-link"
          :class="{ active: isLinkActive(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>

        <div class="side-section-title">{{ t("nav.sections") }}</div>
        <NuxtLink
          v-for="link in sectionLinks"
          :key="link.to"
          :to="link.to"
          class="side-link side-link-sub"
          :class="{ active: isLinkActive(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>
      </template>

      <template v-else>
        <NuxtLink
          v-for="link in customerLinks"
          :key="link.to"
          :to="link.to"
          class="side-link"
          :class="{ active: isLinkActive(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>
      </template>

      <button class="side-link logout-btn" type="button" @click="logout">{{ t("nav.logout") }}</button>
    </nav>
  </aside>
</template>
