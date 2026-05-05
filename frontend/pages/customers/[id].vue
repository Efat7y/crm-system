<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "admin-auth" })

const route = useRoute()
const { request, formatMoney } = useApi()
const { t, language } = useLang()
const { downloadElementAsPdf } = useInvoicePdf()

const status = ref("")
const account = ref<any | null>(null)
const invoiceDownloadOrder = ref<any | null>(null)
const downloadingInvoiceId = ref<number | null>(null)
const catalogSections = ref<{ raw_materials: any[]; fragrances: any[]; colors: any[] }>({
  raw_materials: [],
  fragrances: [],
  colors: []
})

const itemForm = ref({
  item_name: "",
  category: "raw_material",
  quantity: 1,
  unit: "",
  unit_price: 0,
  notes: ""
})

const paymentForm = ref({
  amount: 0,
  payment_method: "",
  notes: ""
})

const customerId = computed(() => Number(route.params.id || 0))

const currentCategoryItems = computed(() => {
  if (itemForm.value.category === "fragrance") return catalogSections.value.fragrances
  if (itemForm.value.category === "color") return catalogSections.value.colors
  return catalogSections.value.raw_materials
})

function resetItemForm() {
  itemForm.value = {
    item_name: "",
    category: "raw_material",
    quantity: 1,
    unit: "",
    unit_price: 0,
    notes: ""
  }
}

function resetPaymentForm() {
  paymentForm.value = {
    amount: 0,
    payment_method: "",
    notes: ""
  }
}

function categoryLabel(category: string) {
  if (category === "fragrance") return t("ledger.category.fragrance")
  if (category === "color") return t("ledger.category.color")
  return t("ledger.category.raw_material")
}

function transactionTypeLabel(type: string) {
  if (type === "order") return t("kpi.order")
  if (type === "payment") return t("kpi.payment")
  return t("kpi.item_movement")
}

function statusLabel(value: string | null | undefined) {
  if (value === "approved") return t("status.approved")
  if (value === "rejected") return t("status.rejected")
  if (value === "completed") return t("status.completed")
  if (value === "recorded") return t("status.recorded")
  return t("status.pending")
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  return new Date(value).toLocaleString(language.value === "ar" ? "ar-EG" : "en-US")
}

function applyCatalogDefaults() {
  const selected = currentCategoryItems.value.find((item) => item.name === itemForm.value.item_name)
  if (!selected) return

  itemForm.value.unit = selected.default_unit || ""
  itemForm.value.unit_price = Number(selected.default_price || 0)
}

async function loadAccount() {
  if (!customerId.value) return

  const [ledger, sections] = await Promise.all([
    request(`/customers/${customerId.value}/ledger`),
    request("/catalogs/sections")
  ])

  account.value = ledger
  catalogSections.value = sections as any
}

async function addItem() {
  if (!customerId.value) return

  try {
    await request(`/customers/${customerId.value}/items`, {
      method: "POST",
      body: itemForm.value
    })
    status.value = t("common.added_success")
    resetItemForm()
    await loadAccount()
  } catch (error: any) {
    status.value = error.message
  }
}

async function addPayment() {
  if (!customerId.value) return

  try {
    await request(`/customers/${customerId.value}/payments`, {
      method: "POST",
      body: paymentForm.value
    })
    status.value = t("common.added_success")
    resetPaymentForm()
    await loadAccount()
  } catch (error: any) {
    status.value = error.message
  }
}

async function deleteItem(itemId: number) {
  if (!customerId.value || !window.confirm(t("common.confirm_delete_item"))) return

  try {
    await request(`/customers/${customerId.value}/items/${itemId}`, { method: "DELETE" })
    await loadAccount()
  } catch (error: any) {
    status.value = error.message
  }
}

async function deletePayment(paymentId: number) {
  if (!customerId.value || !window.confirm(t("common.confirm_delete_item"))) return

  try {
    await request(`/customers/${customerId.value}/payments/${paymentId}`, { method: "DELETE" })
    await loadAccount()
  } catch (error: any) {
    status.value = error.message
  }
}

async function downloadOrderInvoice(orderId: number) {
  if (downloadingInvoiceId.value) return

  downloadingInvoiceId.value = orderId
  status.value = ""

  try {
    invoiceDownloadOrder.value = await request(`/shop/orders/${orderId}/invoice`)
    await nextTick()
    await downloadElementAsPdf(
      "customer-account-invoice-download",
      `invoice-${invoiceDownloadOrder.value?.invoice_number || orderId}`
    )
  } catch (error: any) {
    status.value = error.message
  } finally {
    invoiceDownloadOrder.value = null
    downloadingInvoiceId.value = null
  }
}

watch(
  () => itemForm.value.category,
  () => {
    itemForm.value.item_name = ""
    itemForm.value.unit = ""
    itemForm.value.unit_price = 0
  }
)

try {
  await loadAccount()
} catch (error: any) {
  status.value = error.message
}
</script>

<template>
  <div>
    <PageHeader
      :title="account?.customer?.name || `${t('customer.account.title')} #${route.params.id}`"
      :subtitle="t('customer.account.subtitle')"
    />

    <div class="page-actions">
      <NuxtLink to="/customers" class="link-btn">{{ t("nav.customers") }}</NuxtLink>
    </div>

    <section v-if="account" class="details-grid" style="margin-top: 14px">
      <section class="panel">
        <h2>{{ t("customer.account.profile") }}</h2>
        <div class="detail-list">
          <div class="detail-row">
            <span>{{ t("common.name") }}</span>
            <strong>{{ account.customer.name }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.email") }}</span>
            <strong>{{ account.customer.email || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.phone") }}</span>
            <strong>{{ account.customer.phone || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.company") }}</span>
            <strong>{{ account.customer.company || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.address") }}</span>
            <strong>{{ account.customer.address || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.notes") }}</span>
            <strong>{{ account.customer.notes || "-" }}</strong>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>{{ t("ledger.title") }}</h2>
        <div class="summary-grid">
          <div>
            <span>{{ t("customer.account.total_charges") }}</span>
            <strong>{{ formatMoney(account.summary.total_charges_amount) }}</strong>
          </div>
          <div>
            <span>{{ t("customer.account.approved_orders") }}</span>
            <strong>{{ formatMoney(account.summary.approved_orders_amount) }}</strong>
          </div>
          <div>
            <span>{{ t("customer.account.pending_orders") }}</span>
            <strong>{{ formatMoney(account.summary.pending_orders_amount) }}</strong>
          </div>
          <div>
            <span>{{ t("ledger.total_paid") }}</span>
            <strong>{{ formatMoney(account.summary.total_paid_amount) }}</strong>
          </div>
          <div>
            <span>{{ t("ledger.balance_due") }}</span>
            <strong>{{ formatMoney(account.summary.balance_due) }}</strong>
          </div>
          <div>
            <span>{{ t("customer.account.order_count") }}</span>
            <strong>{{ account.summary.total_orders_count }}</strong>
          </div>
        </div>

        <p v-if="account.summary.credit_balance > 0" class="status">
          {{ t("customer.account.credit_balance") }}: {{ formatMoney(account.summary.credit_balance) }}
        </p>
      </section>
    </section>

    <section v-if="account" class="two-columns" style="margin-top: 14px">
      <form class="form-grid compact panel" @submit.prevent="addItem">
        <h2 class="wide">{{ t("ledger.add_movement") }}</h2>
        <label>
          {{ t("ledger.category") }}
          <select v-model="itemForm.category">
            <option value="raw_material">{{ t("ledger.category.raw_material") }}</option>
            <option value="fragrance">{{ t("ledger.category.fragrance") }}</option>
            <option value="color">{{ t("ledger.category.color") }}</option>
          </select>
        </label>
        <label>
          {{ t("ledger.item_name") }}
          <select v-model="itemForm.item_name" required @change="applyCatalogDefaults">
            <option disabled value="">{{ t("common.select_item") }}</option>
            <option v-for="item in currentCategoryItems" :key="item.id" :value="item.name">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label>
          {{ t("ledger.quantity") }}
          <input v-model.number="itemForm.quantity" type="number" min="0.01" step="0.01" required />
        </label>
        <label>
          {{ t("ledger.unit") }}
          <input v-model="itemForm.unit" />
        </label>
        <label>
          {{ t("ledger.unit_price") }}
          <input v-model.number="itemForm.unit_price" type="number" min="0" step="0.01" required />
        </label>
        <label class="wide">
          {{ t("ledger.notes") }}
          <input v-model="itemForm.notes" />
        </label>
        <div class="wide actions">
          <button type="submit">{{ t("ledger.save_movement") }}</button>
        </div>
      </form>

      <form class="form-grid compact panel" @submit.prevent="addPayment">
        <h2 class="wide">{{ t("ledger.add_payment") }}</h2>
        <label>
          {{ t("ledger.amount") }}
          <input v-model.number="paymentForm.amount" type="number" min="0.01" step="0.01" required />
        </label>
        <label>
          {{ t("ledger.payment_method") }}
          <input v-model="paymentForm.payment_method" />
        </label>
        <label class="wide">
          {{ t("ledger.notes") }}
          <input v-model="paymentForm.notes" />
        </label>
        <div class="wide actions">
          <button type="submit">{{ t("ledger.save_payment") }}</button>
        </div>
      </form>
    </section>

    <section v-if="account" class="panel" style="margin-top: 14px">
      <h2>{{ t("customer.account.orders") }}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t("order.order_number") }}</th>
              <th>{{ t("portal.selected_items") }}</th>
              <th>{{ t("order.items_count") }}</th>
              <th>{{ t("common.total") }}</th>
              <th>{{ t("dashboard.status") }}</th>
              <th>{{ t("common.date") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!account.orders.length">
              <td colspan="7">{{ t("customer.account.empty_orders") }}</td>
            </tr>
            <tr v-for="order in account.orders" :key="order.id">
              <td>#{{ order.id }}</td>
              <td>{{ order.products_summary || order.product_name }}</td>
              <td>{{ order.items_count }}</td>
              <td>{{ formatMoney(order.total_amount) }}</td>
              <td>
                <span class="status-pill" :class="`status-pill-${order.status}`">{{ statusLabel(order.status) }}</span>
              </td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>
                <div class="row-actions">
                  <NuxtLink :to="`/orders/${order.id}`" class="link-btn">{{ t("common.details") }}</NuxtLink>
                  <NuxtLink v-if="order.invoice_ready" :to="`/orders/${order.id}/invoice`" class="link-btn">
                    {{ t("order.view_invoice") }}
                  </NuxtLink>
                  <button
                    v-if="order.invoice_ready"
                    type="button"
                    class="ghost"
                    :disabled="downloadingInvoiceId === order.id"
                    @click="downloadOrderInvoice(order.id)"
                  >
                    {{ downloadingInvoiceId === order.id ? t("auth.loading") : t("order.download_invoice") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="account" class="two-columns" style="margin-top: 14px">
      <section class="panel">
        <h2>{{ t("customer.account.manual_entries") }}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t("ledger.item") }}</th>
                <th>{{ t("ledger.category") }}</th>
                <th>{{ t("ledger.quantity") }}</th>
                <th>{{ t("ledger.total") }}</th>
                <th>{{ t("ledger.date") }}</th>
                <th>{{ t("common.delete") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!account.items.length">
                <td colspan="6">{{ t("ledger.no_movements") }}</td>
              </tr>
              <tr v-for="item in account.items" :key="item.id">
                <td>{{ item.item_name }}</td>
                <td>{{ categoryLabel(item.category) }}</td>
                <td>{{ item.quantity }} {{ item.unit || "" }}</td>
                <td>{{ formatMoney(item.total_amount) }}</td>
                <td>{{ formatDate(item.created_at) }}</td>
                <td><button class="danger" type="button" @click="deleteItem(item.id)">{{ t("common.delete") }}</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h2>{{ t("ledger.payments") }}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t("ledger.amount") }}</th>
                <th>{{ t("ledger.payment_method") }}</th>
                <th>{{ t("common.notes") }}</th>
                <th>{{ t("ledger.date") }}</th>
                <th>{{ t("common.delete") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!account.payments.length">
                <td colspan="5">{{ t("ledger.no_payments") }}</td>
              </tr>
              <tr v-for="payment in account.payments" :key="payment.id">
                <td>{{ formatMoney(payment.amount) }}</td>
                <td>{{ payment.payment_method || "-" }}</td>
                <td>{{ payment.notes || "-" }}</td>
                <td>{{ formatDate(payment.created_at) }}</td>
                <td>
                  <button class="danger" type="button" @click="deletePayment(payment.id)">{{ t("common.delete") }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section v-if="account" class="panel" style="margin-top: 14px">
      <h2>{{ t("customer.account.transactions") }}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t("kpi.type") }}</th>
              <th>{{ t("kpi.details") }}</th>
              <th>{{ t("dashboard.status") }}</th>
              <th>{{ t("kpi.value") }}</th>
              <th>{{ t("kpi.date") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!account.transactions.length">
              <td colspan="5">{{ t("customer.account.empty_transactions") }}</td>
            </tr>
            <tr v-for="entry in account.transactions" :key="entry.id">
              <td>{{ transactionTypeLabel(entry.movement_type) }}</td>
              <td>{{ entry.title }}</td>
              <td>{{ statusLabel(entry.status) }}</td>
              <td>{{ formatMoney(entry.amount) }}</td>
              <td>{{ formatDate(entry.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p v-if="status" class="status">{{ status }}</p>

    <div v-if="invoiceDownloadOrder" class="pdf-capture-stage" aria-hidden="true">
      <OrderInvoiceSheet
        :order="invoiceDownloadOrder"
        :format-money="formatMoney"
        :subtitle="t('order.invoice_subtitle_admin')"
        sheet-id="customer-account-invoice-download"
      />
    </div>
  </div>
</template>
