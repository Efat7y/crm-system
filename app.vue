<script setup lang="ts">
const { language, isRtl, initLanguage } = useLang()
const auth = useAuth()

initLanguage()

onMounted(async () => {
  await auth.initAuth()
})

useHead(() => ({
  htmlAttrs: {
    lang: language.value,
    dir: isRtl.value ? "rtl" : "ltr"
  }
}))

// Dynamic RTL update
watch([isRtl, language], ([rtl, lang]) => {
  if (process.client) {
    document.documentElement.dir = rtl ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
