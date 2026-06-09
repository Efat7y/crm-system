<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "admin-auth" })

const route = useRoute()
const { request, formatMoney } = useApi()
const { t } = useLang()

const category = computed(() => route.params.category as string)
const isValidCategory = computed(() => ["raw_material", "fragrance", "color"].includes(category.value))
const categoryLabel = computed(() => {
  if (category.value === "raw_material") return t("ledger.category.raw_material")
  if (category.value === "fragrance") return t("ledger.category.fragrance")
  if (category.value === "color") return t("ledger.category.color")
  return t("section.unknown")
})

const status = ref("")
const items = ref<any[]>([])
const editingId = ref<number | null>(null)
const form = ref({
  name: "",
  default_price: 0
})

function resetForm() {
  form.value = {
    name: "",
    default_price: 0
  }
  editingId.value = null
}

async function loadItems() {
  if (!isValidCategory.value) return
  items.value = await request("/catalogs", {
    query: { category: category.value }
  })
}

function startEdit(item: any) {
  editingId.value = item.id
  form.value = {
    name: item.name || "",
    default_price: Number(item.default_price || 0)
  }
}

async function saveItem() {
  if (!isValidCategory.value) return
  try {
    const payload = {
      name: form.value.name,
      default_price: form.value.default_price,
      category: category.value
    }

    if (editingId.value) {
      await request(`/catalogs/${editingId.value}`, { method: "PUT", body: payload })
      status.value = t("common.saved_success")
    } else {
      await request("/catalogs", { method: "POST", body: payload })
      status.value = t("common.added_success")
    }

    await loadItems()
    resetForm()
  } catch (error: any) {
    status.value = error.message
  }
}

async function deleteItem(id: number) {
  if (!window.confirm(t("common.confirm_delete_item"))) return
  try {
    await request(`/catalogs/${id}`, { method: "DELETE" })
    if (editingId.value === id) resetForm()
    await loadItems()
  } catch (error: any) {
    status.value = error.message
  }
}

watch(
  () => category.value,
  async () => {
    resetForm()
    await loadItems()
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <PageHeader :title="`${t('section.manage_category')} ${categoryLabel}`" :subtitle="t('section.subtitle')" />

    <section v-if="!isValidCategory" class="panel">
      <p>{{ t("section.not_found") }}</p>
    </section>

    <section v-else class="content-grid catalogs-grid">
      <section class="panel">
        <h2>{{ editingId ? t("section.edit_item") : t("section.add_item") }}</h2>
        <form class="form-grid compact" @submit.prevent="saveItem">
          <label>
            {{ t("common.name") }}
            <input v-model="form.name" required />
          </label>
          <label>
            {{ t("common.price") }}
            <input v-model.number="form.default_price" type="number" min="0" step="0.01" required />
          </label>
          <div class="wide actions">
            <button type="submit">{{ editingId ? t("common.save_changes") : t("section.add_item") }}</button>
            <button type="button" class="ghost" @click="resetForm">{{ t("common.reset") }}</button>
          </div>
        </form>
      </section>

      <section class="panel">
        <h2>{{ t("section.products") }}</h2>
        <div class="cards-grid">
          <article v-for="item in items" :key="item.id" class="product-card">
            <h3>{{ item.name }}</h3>
            <div class="badge">{{ t("common.price") }}: {{ formatMoney(item.default_price) }}</div>
            <div class="row-actions" style="margin-top: 10px">
              <button class="ghost" @click="startEdit(item)">{{ t("common.edit") }}</button>
              <button class="danger" @click="deleteItem(item.id)">{{ t("common.delete") }}</button>
            </div>
          </article>
          <div v-if="items.length === 0" class="panel-soft">{{ t("section.no_items") }}</div>
        </div>
      </section>
    </section>

    <p class="status">{{ status }}</p>
  </div>
</template>
