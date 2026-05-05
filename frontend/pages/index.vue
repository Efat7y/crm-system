<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "admin-auth" })

const { request, formatMoney } = useApi()
const { t } = useLang()

const status = ref("")
const data = ref<any>(null)
const sections = ref<{ raw_materials: any[]; fragrances: any[]; colors: any[] }>({
  raw_materials: [],
  fragrances: [],
  colors: []
})
const updates = ref<any[]>([])
const orders = ref<any[]>([])
const publishing = ref(false)
const changingOrderStatus = reactive<Record<number, boolean>>({})
const updateForm = ref({
  title: "",
  content: ""
})

function statusLabel(value: string) {
  if (value === "approved") return t("status.approved")
  if (value === "rejected") return t("status.rejected")
  if (value === "completed") return t("status.completed")
  return t("status.pending")
}

async function loadOverview() {
  try {
    const [overview, catalogSections, updatesRows, ordersRows] = await Promise.all([
      request("/dashboard/overview"),
      request("/catalogs/sections"),
      request("/shop/updates"),
      request("/shop/orders")
    ])
    data.value = overview
    sections.value = catalogSections as any
    updates.value = updatesRows as any[]
    orders.value = ordersRows as any[]
  } catch (error: any) {
    status.value = error.message
  }
}

async function addUpdate() {
  status.value = ""

  const payload = {
    title: updateForm.value.title.trim(),
    content: updateForm.value.content.trim()
  }

  if (!payload.title || !payload.content) {
    status.value = t("dashboard.update_required")
    return
  }

  publishing.value = true

  try {
    await request("/shop/updates", {
      method: "POST",
      body: payload
    })
    updateForm.value = { title: "", content: "" }
    updates.value = (await request("/shop/updates")) as any[]
    status.value = t("dashboard.update_published")
  } catch (error: any) {
    status.value = error.message
  } finally {
    publishing.value = false
  }
}

async function removeUpdate(id: number) {
  try {
    await request(`/shop/updates/${id}`, { method: "DELETE" })
    updates.value = updates.value.filter((u) => u.id !== id)
  } catch (error: any) {
    status.value = error.message
  }
}

async function changeOrderStatus(order: any, nextStatus: string) {
  const previousStatus = order.status
  order.status = nextStatus
  changingOrderStatus[order.id] = true
  status.value = ""

  try {
    const updatedOrder = await request(`/shop/orders/${order.id}/status`, {
      method: "PUT",
      body: { status: nextStatus }
    })
    orders.value = orders.value.map((item) => (item.id === order.id ? { ...item, ...updatedOrder } : item))
  } catch (error: any) {
    order.status = previousStatus
    status.value = error.message
  } finally {
    delete changingOrderStatus[order.id]
  }
}

function openCustomer(customerId: number) {
  navigateTo(`/customers/${customerId}`)
}

function openOrder(orderId: number) {
  navigateTo(`/orders/${orderId}`)
}

function openInvoice(orderId: number) {
  navigateTo(`/orders/${orderId}/invoice`)
}

onMounted(loadOverview)
</script>

<template>
  <div>
    <PageHeader :title="t('dashboard.title')" :subtitle="t('dashboard.subtitle')" />
    <DashboardOverview :data="data" :format-money="formatMoney" />
    <HomeSectionCards :raw-materials="sections.raw_materials" :fragrances="sections.fragrances" :colors="sections.colors" />

    <section class="grid">
      <section class="panel">
        <h2>{{ t("dashboard.updates") }}</h2>
        <form class="form-grid compact" @submit.prevent="addUpdate">
          <label class="wide">
            {{ t("dashboard.update_title") }}
            <input v-model="updateForm.title" required />
          </label>
          <label class="wide">
            {{ t("dashboard.update_content") }}
            <textarea v-model="updateForm.content" rows="4" required />
          </label>
          <div class="wide actions">
            <button type="submit" :disabled="publishing">
              {{ publishing ? t("auth.loading") : t("dashboard.publish") }}
            </button>
          </div>
        </form>

        <div class="chips">
          <article v-for="item in updates" :key="item.id" class="chip">
            <div>
              <strong>{{ item.title }}</strong>
              <small>{{ item.content }}</small>
            </div>
            <button class="danger" type="button" @click="removeUpdate(item.id)">{{ t("common.delete") }}</button>
          </article>
        </div>
      </section>

      <section class="panel">
        <h2>{{ t("dashboard.orders") }}</h2>
        <div class="table-wrap">
          <table>
            <thead>
            <tr>
              <th>{{ t("dashboard.customer") }}</th>
              <th>{{ t("portal.selected_items") }}</th>
              <th>{{ t("order.items_count") }}</th>
              <th>{{ t("dashboard.total") }}</th>
              <th>{{ t("dashboard.status") }}</th>
              <th>{{ t("dashboard.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orders" :key="item.id">
              <td>
                <button type="button" class="link-btn" @click.stop.prevent="openCustomer(item.customer_id)">
                  {{ item.customer_name }}
                </button>
              </td>
                <td>{{ item.products_summary || item.product_name }}</td>
                <td>{{ item.items_count }}</td>
                <td>{{ formatMoney(item.total_amount) }}</td>
                <td>
                  <select
                    v-model="item.status"
                    :disabled="changingOrderStatus[item.id]"
                    @change="changeOrderStatus(item, item.status)"
                  >
                    <option value="pending">{{ statusLabel("pending") }}</option>
                    <option value="approved">{{ statusLabel("approved") }}</option>
                    <option value="rejected">{{ statusLabel("rejected") }}</option>
                    <option value="completed">{{ statusLabel("completed") }}</option>
                  </select>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="link-btn" @click.stop.prevent="openOrder(item.id)">
                      {{ t("common.details") }}
                    </button>
                    <button
                      v-if="item.invoice_ready"
                      type="button"
                      class="link-btn"
                      @click.stop.prevent="openInvoice(item.id)"
                    >
                      {{ t("order.view_invoice") }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <p class="status">{{ status }}</p>
  </div>
</template>
