<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "admin-auth" })

const { request } = useApi()
const { t } = useLang()

const status = ref("")
const sections = ref<{ raw_materials: any[]; fragrances: any[]; colors: any[] }>({
  raw_materials: [],
  fragrances: [],
  colors: []
})

const materialForm = ref({
  name: "",
  default_price: 0
})

const fragranceForm = ref({
  name: "",
  default_price: 0
})

const colorForm = ref({
  name: "",
  default_price: 0
})

async function loadSections() {
  sections.value = await request("/catalogs/sections")
}

async function addItem(category: "raw_material" | "fragrance" | "color") {
  try {
    const form =
      category === "raw_material" ? materialForm.value : category === "fragrance" ? fragranceForm.value : colorForm.value

    await request("/catalogs", {
      method: "POST",
      body: {
        name: form.name,
        default_price: form.default_price,
        category
      }
    })

    form.name = ""
    form.default_price = 0
    status.value = t("common.added_success")
    await loadSections()
  } catch (error: any) {
    status.value = error.message
  }
}

async function removeItem(id: number) {
  if (!window.confirm(t("common.confirm_delete_item"))) return
  try {
    await request(`/catalogs/${id}`, { method: "DELETE" })
    await loadSections()
  } catch (error: any) {
    status.value = error.message
  }
}

onMounted(async () => {
  try {
    await loadSections()
  } catch (error: any) {
    status.value = error.message
  }
})
</script>

<template>
  <div>
    <PageHeader :title="t('catalog.title')" :subtitle="t('catalog.subtitle')" />
    <section class="grid catalogs-grid">
      <CatalogSection
        :title="t('catalog.raw_title')"
        :subtitle="t('catalog.raw_sub')"
        :button-text="t('catalog.add_raw')"
        :name-label="t('catalog.raw_name')"
        :items="sections.raw_materials"
        :form="materialForm"
        @submit="addItem('raw_material')"
        @delete="removeItem"
      />

      <CatalogSection
        :title="t('catalog.frag_title')"
        :subtitle="t('catalog.frag_sub')"
        :button-text="t('catalog.add_frag')"
        :name-label="t('catalog.frag_name')"
        :items="sections.fragrances"
        :form="fragranceForm"
        @submit="addItem('fragrance')"
        @delete="removeItem"
      />

      <CatalogSection
        :title="t('catalog.color_title')"
        :subtitle="t('catalog.color_sub')"
        :button-text="t('catalog.add_color')"
        :name-label="t('catalog.color_name')"
        :items="sections.colors"
        :form="colorForm"
        @submit="addItem('color')"
        @delete="removeItem"
      />
    </section>
    <p class="status">{{ status }}</p>
  </div>
</template>
