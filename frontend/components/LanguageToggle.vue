<script setup lang="ts">
const { language, toggleLanguage, t } = useLang()
</script>

<template>
  <button class="lang-toggle" type="button" @click="toggleLanguage">
    {{ language === "ar" ? t("lang.en") : t("lang.ar") }}
  </button>
</template>
