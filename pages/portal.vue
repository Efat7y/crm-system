<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "customer-auth" })

const auth = useAuth()
const { request, formatMoney } = useApi()
const { t } = useLang()

const status = ref("")
const updates = ref<any[]>([])
const catalog = ref<{ raw_materials: any[]; fragrances: any[]; colors: any[] }>({
  raw_materials: [],
  fragrances: [],
  colors: []
})
const orders = ref<any[]>([])
const submitting = ref(false)
const orderNotes = ref("")
const selectedQuantities = reactive<Record<string, number>>({})

const allProducts = computed(() => [
  ...catalog.value.raw_materials.map((item) => ({ ...item, category: "raw_material" })),
  ...catalog.value.fragrances.map((item) => ({ ...item, category: "fragrance" })),
  ...catalog.value.colors.map((item) => ({ ...item, category: "color" }))
])

const productSections = computed(() => [
  {
    key: "raw_material",
    title: t("ledger.category.raw_material"),
    items: catalog.value.raw_materials.map((item) => ({ ...item, category: "raw_material" }))
  },
  {
    key: "fragrance",
    title: t("ledger.category.fragrance"),
    items: catalog.value.fragrances.map((item) => ({ ...item, category: "fragrance" }))
  },
  {
    key: "color",
    title: t("ledger.category.color"),
    items: catalog.value.colors.map((item) => ({ ...item, category: "color" }))
  }
])

const selectedOrderItems = computed(() =>
  allProducts.value
    .filter((item) => isProductSelected(item))
    .map((item) => {
      const quantity = getProductQuantity(item)
      const unitPrice = Number(item.default_price || 0)
      return {
        id: item.id,
        product_name: item.name,
        category: item.category,
        quantity,
        unit: item.default_unit || "",
        unit_price: unitPrice,
        total_amount: Number((quantity * unitPrice).toFixed(2))
      }
    })
)

const orderTotal = computed(() =>
  Number(selectedOrderItems.value.reduce((sum, item) => sum + Number(item.total_amount || 0), 0).toFixed(2))
)

function productKey(item: any) {
  return `${item.category}::${item.id}`
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1
  return Number(value.toFixed(2))
}

function categoryLabel(category: string) {
  if (category === "fragrance") return t("ledger.category.fragrance")
  if (category === "color") return t("ledger.category.color")
  return t("ledger.category.raw_material")
}

function statusLabel(value: string) {
  if (value === "approved") return t("status.approved")
  if (value === "rejected") return t("status.rejected")
  if (value === "completed") return t("status.completed")
  return t("status.pending")
}

function isProductSelected(item: any) {
  return Object.prototype.hasOwnProperty.call(selectedQuantities, productKey(item))
}

function getProductQuantity(item: any) {
  return selectedQuantities[productKey(item)] || 1
}

function ensureSelected(item: any) {
  const key = productKey(item)
  if (!Object.prototype.hasOwnProperty.call(selectedQuantities, key)) {
    selectedQuantities[key] = 1
  }
}

function toggleProduct(item: any, checked: boolean) {
  const key = productKey(item)
  if (checked) {
    selectedQuantities[key] = normalizeQuantity(Number(selectedQuantities[key] || 1))
  } else {
    delete selectedQuantities[key]
  }
}

function setProductQuantity(item: any, value: number) {
  ensureSelected(item)
  selectedQuantities[productKey(item)] = normalizeQuantity(value)
}

function updateProductQuantity(item: any, value: string) {
  const parsed = Number.parseFloat(value)
  setProductQuantity(item, Number.isNaN(parsed) ? 1 : parsed)
}

function changeProductQuantity(item: any, delta: number) {
  const nextQuantity = getProductQuantity(item) + delta
  setProductQuantity(item, nextQuantity <= 0 ? 1 : nextQuantity)
}

function removeSelectedItem(item: any) {
  delete selectedQuantities[productKey(item)]
}

function clearSelection() {
  Object.keys(selectedQuantities).forEach((key) => {
    delete selectedQuantities[key]
  })
}

function getSelectedCount(items: any[]) {
  return items.filter((item) => isProductSelected(item)).length
}

async function loadPortalData() {
  try {
    const [catalogData, updatesData, myOrders] = await Promise.all([
      request("/shop/catalog"),
      request("/shop/updates"),
      request("/shop/orders/me")
    ])
    catalog.value = catalogData as any
    updates.value = updatesData as any[]
    orders.value = myOrders as any[]
  } catch (error: any) {
    status.value = error.message
  }
}

async function submitOrder() {
  if (!selectedOrderItems.value.length) {
    status.value = t("portal.order_items_required")
    return
  }

  status.value = ""
  submitting.value = true

  try {
    await request("/shop/orders", {
      method: "POST",
      body: {
        items: selectedOrderItems.value.map((item) => ({
          product_name: item.product_name,
          category: item.category,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        notes: orderNotes.value
      }
    })

    clearSelection()
    orderNotes.value = ""
    orders.value = (await request("/shop/orders/me")) as any[]
    status.value = t("portal.order_submitted")
  } catch (error: any) {
    status.value = error.message
  } finally {
    submitting.value = false
  }
}

onMounted(loadPortalData)
</script>

<template>
  <div>
    <PageHeader :title="`${t('portal.title')} - ${auth.user.value?.name || ''}`" :subtitle="t('portal.subtitle')" />

    <section class="content-grid catalogs-grid">
      <section class="panel">
        <h2>{{ t("portal.latest_updates") }}</h2>
        <div class="chips">
          <article v-for="item in updates" :key="item.id" class="chip">
            <div>
              <strong>{{ item.title }}</strong>
              <small>{{ item.content }}</small>
            </div>
          </article>
          <p v-if="updates.length === 0" class="status">{{ t("portal.no_updates") }}</p>
        </div>
      </section>

      <section class="panel">
        <h2>{{ t("portal.new_order") }}</h2>
        <p class="subtitle">{{ t("portal.selection_help") }}</p>

        <form @submit.prevent="submitOrder">
          <div class="order-builder">
            <section v-for="section in productSections" :key="section.key" class="panel-soft order-picker-section">
              <div class="order-picker-head">
                <h3>{{ section.title }}</h3>
                <span>{{ getSelectedCount(section.items) }} / {{ section.items.length }}</span>
              </div>

              <div class="order-picker-list">
                <div
                  v-for="item in section.items"
                  :key="`${section.key}-${item.id}`"
                  class="order-picker-item"
                  :class="{ 'order-picker-item-active': isProductSelected(item) }"
                  role="button"
                  tabindex="0"
                  @click="toggleProduct(item, !isProductSelected(item))"
                  @keydown.enter.prevent="toggleProduct(item, !isProductSelected(item))"
                  @keydown.space.prevent="toggleProduct(item, !isProductSelected(item))"
                >
                  <div class="order-picker-main">
                    <input
                      :id="`order-item-${section.key}-${item.id}`"
                      class="order-picker-checkbox"
                      type="checkbox"
                      :checked="isProductSelected(item)"
                      @click.stop
                      @change.stop="toggleProduct(item, ($event.target as HTMLInputElement).checked)"
                    />
                    <label :for="`order-item-${section.key}-${item.id}`">
                      <strong>{{ item.name }}</strong>
                      <small>{{ t("common.unit") }}: {{ item.default_unit || "-" }}</small>
                    </label>
                  </div>

                  <div class="order-picker-side" @click.stop>
                    <span class="order-picker-price">{{ formatMoney(item.default_price) }}</span>
                    <div class="order-picker-qty-wrap">
                      <button
                        type="button"
                        class="order-picker-stepper"
                        :disabled="!isProductSelected(item)"
                        @click.stop="changeProductQuantity(item, -1)"
                      >
                        -
                      </button>
                      <input
                        class="order-picker-qty"
                        type="number"
                        min="0.1"
                        step="0.1"
                        :disabled="!isProductSelected(item)"
                        :value="getProductQuantity(item)"
                        @focus="ensureSelected(item)"
                        @click.stop
                        @input="updateProductQuantity(item, ($event.target as HTMLInputElement).value)"
                      />
                      <button
                        type="button"
                        class="order-picker-stepper"
                        :disabled="!isProductSelected(item)"
                        @click.stop="changeProductQuantity(item, 1)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div class="summary-grid" style="margin-top: 14px">
            <div>
              <span>{{ t("order.items_count") }}</span>
              <strong>{{ selectedOrderItems.length }}</strong>
            </div>
            <div>
              <span>{{ t("portal.order_total") }}</span>
              <strong>{{ formatMoney(orderTotal) }}</strong>
            </div>
          </div>

          <section class="panel-soft" style="margin-top: 14px">
            <div class="page-actions" style="margin-top: 0">
              <h3 style="margin-inline-end: auto">{{ t("portal.selected_items") }}</h3>
              <button
                v-if="selectedOrderItems.length"
                type="button"
                class="ghost"
                @click="clearSelection"
              >
                {{ t("portal.clear_selection") }}
              </button>
            </div>

            <div class="table-wrap" style="margin-top: 10px">
              <table>
                <thead>
                  <tr>
                    <th>{{ t("common.product") }}</th>
                    <th>{{ t("common.category") }}</th>
                    <th>{{ t("common.quantity") }}</th>
                    <th>{{ t("common.unit") }}</th>
                    <th>{{ t("portal.unit_price") }}</th>
                    <th>{{ t("common.total") }}</th>
                    <th>{{ t("common.delete") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!selectedOrderItems.length">
                    <td colspan="7">{{ t("portal.empty_selected_items") }}</td>
                  </tr>
                  <tr
                    v-for="item in selectedOrderItems"
                    :key="`${item.category}-${item.product_name}`"
                  >
                    <td>{{ item.product_name }}</td>
                    <td>{{ categoryLabel(item.category) }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.unit || "-" }}</td>
                    <td>{{ formatMoney(item.unit_price) }}</td>
                    <td>{{ formatMoney(item.total_amount) }}</td>
                    <td>
                      <button type="button" class="danger" @click="removeSelectedItem(item)">{{ t("common.delete") }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <label style="margin-top: 14px">
            {{ t("portal.notes") }}
            <textarea v-model="orderNotes" rows="3" />
          </label>

          <div class="page-actions">
            <button type="submit" :disabled="submitting || !selectedOrderItems.length">
              {{ submitting ? t("auth.loading") : t("portal.submit_order") }}
            </button>
          </div>
        </form>
      </section>
    </section>

    <section class="panel" style="margin-top: 14px">
      <h2>{{ t("portal.my_orders") }}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t("order.order_number") }}</th>
              <th>{{ t("portal.selected_items") }}</th>
              <th>{{ t("order.items_count") }}</th>
              <th>{{ t("common.total") }}</th>
              <th>{{ t("dashboard.status") }}</th>
              <th>{{ t("portal.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orders" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>{{ item.products_summary || item.product_name }}</td>
              <td>{{ item.items_count }}</td>
              <td>{{ formatMoney(item.total_amount) }}</td>
              <td>{{ statusLabel(item.status) }}</td>
              <td>
                <div class="row-actions">
                  <NuxtLink :to="`/portal/orders/${item.id}`" class="link-btn">{{ t("common.details") }}</NuxtLink>
                  <NuxtLink
                    v-if="item.invoice_ready"
                    :to="`/portal/orders/${item.id}/invoice`"
                    class="link-btn"
                  >
                    {{ t("order.view_invoice") }}
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="status">{{ status }}</p>
  </div>
</template>
