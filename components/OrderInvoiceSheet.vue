<script setup lang="ts">
const props = defineProps<{
  order: any
  formatMoney: (value: number | null | undefined) => string
  subtitle: string
  sheetId?: string
}>()

const { t, language } = useLang()

const invoiceItems = computed(() => {
  if (Array.isArray(props.order?.items) && props.order.items.length) {
    return props.order.items
  }

  if (!props.order) return []

  return [
    {
      product_name: props.order.product_name,
      category: props.order.category,
      quantity: props.order.quantity,
      unit: props.order.unit,
      unit_price: props.order.unit_price,
      total_amount: props.order.total_amount
    }
  ]
})

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

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  return new Date(value).toLocaleString(language.value === "ar" ? "ar-EG" : "en-US")
}
</script>

<template>
  <section :id="props.sheetId || 'invoice-sheet'" class="panel invoice-sheet">
    <div class="invoice-head">
      <div class="invoice-brand">
        <div class="invoice-brand-mark">ABE</div>
        <div>
          <p class="subtitle">{{ subtitle }}</p>
          <h2>ABE Trading</h2>
          <p class="invoice-tagline">{{ t("order.invoice_title") }}</p>
        </div>
      </div>

      <div class="invoice-total-card">
        <span>{{ t("common.total") }}</span>
        <strong>{{ props.formatMoney(props.order.total_amount) }}</strong>
        <div class="status-pill" :class="`status-pill-${props.order.status}`">
          {{ statusLabel(props.order.status) }}
        </div>
      </div>
    </div>

    <div class="invoice-meta">
      <div>
        <span>{{ t("order.invoice_number") }}</span>
        <strong>{{ props.order.invoice_number }}</strong>
      </div>
      <div>
        <span>{{ t("order.order_number") }}</span>
        <strong>#{{ props.order.id }}</strong>
      </div>
      <div>
        <span>{{ t("order.invoice_issued_at") }}</span>
        <strong>{{ formatDate(props.order.approved_at || props.order.created_at) }}</strong>
      </div>
    </div>

    <div class="invoice-quick-stats">
      <div>
        <span>{{ t("common.name") }}</span>
        <strong>{{ props.order.customer_name || "-" }}</strong>
      </div>
      <div>
        <span>{{ t("common.phone") }}</span>
        <strong>{{ props.order.customer_phone || "-" }}</strong>
      </div>
      <div>
        <span>{{ t("order.items_count") }}</span>
        <strong>{{ props.order.items_count || invoiceItems.length }}</strong>
      </div>
      <div>
        <span>{{ t("common.total") }}</span>
        <strong>{{ props.formatMoney(props.order.total_amount) }}</strong>
      </div>
    </div>

    <div class="details-grid invoice-grid">
      <section class="panel-soft">
        <h3>{{ t("order.customer_information") }}</h3>
        <div class="detail-list">
          <div class="detail-row">
            <span>{{ t("common.name") }}</span>
            <strong>{{ props.order.customer_name || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.email") }}</span>
            <strong>{{ props.order.customer_email || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.phone") }}</span>
            <strong>{{ props.order.customer_phone || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.company") }}</span>
            <strong>{{ props.order.customer_company || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("common.address") }}</span>
            <strong>{{ props.order.customer_address || "-" }}</strong>
          </div>
        </div>
      </section>

      <section class="panel-soft">
        <h3>{{ t("order.order_information") }}</h3>
        <div class="detail-list">
          <div class="detail-row">
            <span>{{ t("portal.selected_items") }}</span>
            <strong>{{ props.order.products_summary || props.order.product_name || "-" }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("order.items_count") }}</span>
            <strong>{{ props.order.items_count || invoiceItems.length }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("dashboard.status") }}</span>
            <strong>{{ statusLabel(props.order.status) }}</strong>
          </div>
          <div class="detail-row">
            <span>{{ t("order.created_at") }}</span>
            <strong>{{ formatDate(props.order.created_at) }}</strong>
          </div>
        </div>
      </section>
    </div>

    <div class="table-wrap" style="margin-top: 14px">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t("common.product") }}</th>
            <th>{{ t("common.category") }}</th>
            <th>{{ t("common.quantity") }}</th>
            <th>{{ t("common.unit") }}</th>
            <th>{{ t("portal.unit_price") }}</th>
            <th>{{ t("common.total") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in invoiceItems" :key="`${item.product_name}-${index}`">
            <td>{{ index + 1 }}</td>
            <td>{{ item.product_name }}</td>
            <td>{{ categoryLabel(item.category) }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.unit || "-" }}</td>
            <td>{{ props.formatMoney(item.unit_price) }}</td>
            <td>{{ props.formatMoney(item.total_amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <section class="panel-soft invoice-notes" style="margin-top: 14px">
      <h3>{{ t("order.order_notes") }}</h3>
      <p>{{ props.order.notes || t("order.no_notes") }}</p>
    </section>

    <div class="invoice-total">
      <span>{{ t("common.total") }}</span>
      <strong>{{ props.formatMoney(props.order.total_amount) }}</strong>
    </div>
  </section>
</template>
