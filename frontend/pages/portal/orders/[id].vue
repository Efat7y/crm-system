<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "customer-auth" })

const route = useRoute()
const { request, formatMoney } = useApi()
const { t, language } = useLang()
const { downloadElementAsPdf } = useInvoicePdf()

const status = ref("")
const order = ref<any | null>(null)
const downloading = ref(false)

function buildFileName() {
  return `invoice-${order.value?.invoice_number || route.params.id}`
}

const orderItems = computed(() => {
  if (Array.isArray(order.value?.items) && order.value.items.length) return order.value.items
  if (!order.value) return []

  return [
    {
      product_name: order.value.product_name,
      category: order.value.category,
      quantity: order.value.quantity,
      unit: order.value.unit,
      unit_price: order.value.unit_price,
      total_amount: order.value.total_amount
    }
  ]
})

const orderItemsTotal = computed(() =>
  Number(orderItems.value.reduce((sum, item) => sum + Number(item.total_amount || 0), 0).toFixed(2))
)

const orderItemsCount = computed(() => order.value?.items_count || orderItems.value.length)

function quantitySummary() {
  return orderItems.value.map((item) => Number(item.quantity || 0)).join(" + ")
}

function statusLabel(value: string) {
  if (value === "approved") return t("status.approved")
  if (value === "rejected") return t("status.rejected")
  if (value === "completed") return t("status.completed")
  return t("status.pending")
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  return new Date(value).toLocaleString(language.value === "ar" ? "ar-EG" : "en-US")
}

async function downloadInvoice() {
  if (!order.value?.invoice_ready) return

  downloading.value = true
  status.value = ""

  try {
    await nextTick()
    await downloadElementAsPdf("portal-order-invoice-download", buildFileName())
  } catch (error: any) {
    status.value = error.message
  } finally {
    downloading.value = false
  }
}

try {
  order.value = await request(`/shop/orders/me/${route.params.id}`)
} catch (error: any) {
  status.value = error.message
}
</script>

<template>
  <div>
    <PageHeader
      :title="`${t('order.details_title')} #${order?.id || route.params.id}`"
      :subtitle="t('order.details_subtitle_customer')"
    />

    <div class="page-actions">
      <NuxtLink to="/portal" class="link-btn">{{ t("order.back_to_portal") }}</NuxtLink>
      <NuxtLink v-if="order?.invoice_ready" :to="`/portal/orders/${order.id}/invoice`" class="link-btn">
        {{ t("order.view_invoice") }}
      </NuxtLink>
      <button v-if="order?.invoice_ready" type="button" class="ghost" :disabled="downloading" @click="downloadInvoice">
        {{ downloading ? t("auth.loading") : t("order.download_invoice") }}
      </button>
    </div>

    <section v-if="order" class="details-grid" style="margin-top: 14px">
      <section class="panel">
        <h2>{{ t("order.order_information") }}</h2>
        <div class="detail-list">
          <div class="detail-row">
            <span>{{ t("order.order_number") }}</span>
            <strong>#{{ order.id }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("order.invoice_number") }}</span>
            <strong>{{ order.invoice_number }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("order.items_count") }}</span>
            <strong>{{ orderItemsCount }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.quantity") }}</span>
            <strong>{{ quantitySummary() }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.total") }}</span>
            <strong>{{ formatMoney(orderItemsTotal || order.total_amount) }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("dashboard.status") }}</span>
            <strong class="status-pill" :class="`status-pill-${order.status}`">{{ statusLabel(order.status) }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("order.created_at") }}</span>
            <strong>{{ formatDate(order.created_at) }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("order.approval_date") }}</span>
            <strong>{{ formatDate(order.approved_at) }}</strong>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>{{ t("order.customer_information") }}</h2>
        <div class="detail-list">
          <div class="detail-row">
            <span>{{ t("common.name") }}</span>
            <strong>{{ order.customer_name || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.email") }}</span>
            <strong>{{ order.customer_email || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.phone") }}</span>
            <strong>{{ order.customer_phone || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.company") }}</span>
            <strong>{{ order.customer_company || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.address") }}</span>
            <strong>{{ order.customer_address || "-" }}</strong>
          </div>
        </div>

        <section class="panel-soft" style="margin-top: 12px">
          <h3>{{ t("order.order_notes") }}</h3>
          <p>{{ order.notes || t("order.no_notes") }}</p>
        </section>

        <p class="status">
          {{ order.invoice_ready ? t("order.invoice_ready") : t("order.invoice_unavailable") }}
        </p>
      </section>
    </section>

    <section v-if="order" class="panel" style="margin-top: 14px">
      <h2>{{ t("portal.selected_items") }}</h2>
      <OrderItemsTable :items="orderItems" :format-money="formatMoney" />
    </section>

    <p v-if="status" class="status status-error">{{ status }}</p>

    <div v-if="order?.invoice_ready" class="pdf-capture-stage" aria-hidden="true">
      <OrderInvoiceSheet
        :order="order"
        :format-money="formatMoney"
        :subtitle="t('order.invoice_subtitle_customer')"
        sheet-id="portal-order-invoice-download"
      />
    </div>
  </div>
</template>
