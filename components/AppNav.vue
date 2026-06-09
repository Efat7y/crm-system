<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const { t } = useLang()
const user = auth.user
const isPinned = ref(false)
const isMobileOpen = ref(false)

const adminLinks = computed(() => [
  { to: "/", label: t("nav.dashboard"), icon: "dashboard" },
  { to: "/customers", label: t("nav.customers"), icon: "customers" },
  { to: "/catalogs", label: t("nav.all_sections"), icon: "catalogs" }
])

const sectionLinks = computed(() => [
  { to: "/sections/raw_material", label: t("nav.raw_materials"), icon: "raw" },
  { to: "/sections/fragrance", label: t("nav.fragrances"), icon: "fragrance" },
  { to: "/sections/color", label: t("nav.colors"), icon: "color" }
])

const customerLinks = computed(() => [{ to: "/portal", label: t("nav.customer_portal"), icon: "portal" }])

const navIcons: Record<string, string[]> = {
  dashboard: [
    "M4 13h6V4H4v9Z",
    "M14 20h6v-9h-6v9Z",
    "M4 20h6v-3H4v3Z",
    "M14 7h6V4h-6v3Z"
  ],
  customers: [
    "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2",
    "M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M21 21v-2a3.5 3.5 0 0 0-2.6-3.4",
    "M16 3.3a4 4 0 0 1 0 7.4"
  ],
  catalogs: [
    "M4 5h7v7H4V5Z",
    "M13 5h7v7h-7V5Z",
    "M4 14h7v5H4v-5Z",
    "M13 14h7v5h-7v-5Z"
  ],
  raw: [
    "M6 3h12",
    "M8 3v6l-4 8a3 3 0 0 0 2.7 4h10.6a3 3 0 0 0 2.7-4l-4-8V3",
    "M7 15h10"
  ],
  fragrance: [
    "M9 2h6v4H9V2Z",
    "M8 6h8",
    "M7 10a5 5 0 0 1 10 0v7a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-7Z",
    "M10 14h4"
  ],
  color: [
    "M12 21a8 8 0 0 0 8-8c0-4.4-8-11-8-11S4 8.6 4 13a8 8 0 0 0 8 8Z",
    "M8.5 14.5a3.5 3.5 0 0 0 7 0"
  ],
  portal: [
    "M5 5h9a5 5 0 0 1 0 10H9v4H5V5Z",
    "M9 9h5a1 1 0 0 1 0 2H9V9Z"
  ],
  logout: [
    "M10 17l5-5-5-5",
    "M15 12H3",
    "M21 19V5a2 2 0 0 0-2-2h-5",
    "M14 21h5a2 2 0 0 0 2-2"
  ],
  brand: [
    "M5 12h4l3-7 3 14 3-7h4",
    "M4 4h16v16H4V4Z"
  ]
}

function iconPaths(name: string) {
  return navIcons[name] || navIcons.dashboard
}

function closeMobileNav() {
  isMobileOpen.value = false
}

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
  closeMobileNav()
  await auth.logout()
  await navigateTo("/login")
}
</script>

<template>
  <button
    class="mobile-nav-toggle"
    type="button"
    :aria-expanded="isMobileOpen"
    aria-label="Open navigation"
    @click="isMobileOpen = true"
  >
    <span class="mobile-nav-text">القائمة</span>
    <span class="mobile-nav-bars">
      <span></span>
      <span></span>
      <span></span>
    </span>
  </button>

  <button
    v-if="isMobileOpen"
    class="side-backdrop"
    type="button"
    aria-label="Close navigation"
    @click="closeMobileNav"
  ></button>

  <aside class="side-nav panel" :class="{ 'side-nav-pinned': isPinned, 'side-nav-open': isMobileOpen }">
    <div class="side-top">
      <div class="brand-lockup">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path v-for="path in iconPaths('brand')" :key="path" :d="path" />
          </svg>
        </span>
        <h2>ABE</h2>
      </div>
      <div class="side-controls">
        <LanguageToggle />
        <button
          class="nav-pin-btn"
          type="button"
          :aria-pressed="isPinned"
          aria-label="Toggle navigation"
          @click="isPinned = !isPinned"
        >
          <span></span>
        </button>
        <button class="nav-close-btn" type="button" aria-label="Close navigation" @click="closeMobileNav">x</button>
      </div>
    </div>
    <p class="subtitle nav-label">{{ t("nav.welcome") }} {{ user?.name || t("nav.user") }}</p>

    <nav class="side-links">
      <template v-if="user?.role === 'admin'">
        <NuxtLink
          v-for="link in adminLinks"
          :key="link.to"
          :to="link.to"
          class="side-link"
          :class="{ active: isLinkActive(link.to) }"
          @click="closeMobileNav"
        >
          <span class="side-link-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path v-for="path in iconPaths(link.icon)" :key="path" :d="path" />
            </svg>
          </span>
          <span class="side-link-label">{{ link.label }}</span>
        </NuxtLink>

        <div class="side-section-title nav-label">{{ t("nav.sections") }}</div>
        <NuxtLink
          v-for="link in sectionLinks"
          :key="link.to"
          :to="link.to"
          class="side-link side-link-sub"
          :class="{ active: isLinkActive(link.to) }"
          @click="closeMobileNav"
        >
          <span class="side-link-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path v-for="path in iconPaths(link.icon)" :key="path" :d="path" />
            </svg>
          </span>
          <span class="side-link-label">{{ link.label }}</span>
        </NuxtLink>
      </template>

      <template v-else>
        <NuxtLink
          v-for="link in customerLinks"
          :key="link.to"
          :to="link.to"
          class="side-link"
          :class="{ active: isLinkActive(link.to) }"
          @click="closeMobileNav"
        >
          <span class="side-link-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path v-for="path in iconPaths(link.icon)" :key="path" :d="path" />
            </svg>
          </span>
          <span class="side-link-label">{{ link.label }}</span>
        </NuxtLink>
      </template>

      <button class="side-link logout-btn" type="button" @click="logout">
        <span class="side-link-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path v-for="path in iconPaths('logout')" :key="path" :d="path" />
          </svg>
        </span>
        <span class="side-link-label">{{ t("nav.logout") }}</span>
      </button>
    </nav>
  </aside>
</template>
