<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "customer-auth" })

const route = useRoute()
const { request, formatMoney } = useApi()
const { t } = useLang()
const { downloadElementAsPdf, printPage } = useInvoicePdf()

const status = ref("")
const order = ref<any | null>(null)
const downloading = ref(false)

function buildFileName() {
  return `invoice-${order.value?.invoice_number || route.params.id}`
}

async function downloadInvoice() {
  if (!order.value) return

  downloading.value = true

  try {
    await nextTick()
    await downloadElementAsPdf("invoice-sheet", buildFileName())
  } catch (error: any) {
    status.value = error.message
  } finally {
    downloading.value = false
  }
}

try {
  order.value = await request(`/shop/orders/me/${route.params.id}/invoice`)
} catch (error: any) {
  status.value = error.message
}

onMounted(async () => {
  if (route.query.download === "1" && order.value) {
    await downloadInvoice()
  }
})
</script>

<template>
  <div>
    <PageHeader
      :title="`${t('order.invoice_title')} #${order?.id || route.params.id}`"
      :subtitle="t('order.invoice_subtitle_customer')"
    />

    <div class="page-actions">
      <NuxtLink :to="`/portal/orders/${route.params.id}`" class="link-btn">{{ t("order.back_to_order") }}</NuxtLink>
      <button type="button" class="ghost" @click="printPage">{{ t("order.print_invoice") }}</button>
      <button type="button" class="ghost" :disabled="downloading" @click="downloadInvoice">
        {{ downloading ? t("auth.loading") : t("order.download_invoice") }}
      </button>
    </div>

    <OrderInvoiceSheet
      v-if="order"
      :order="order"
      :format-money="formatMoney"
      :subtitle="t('order.invoice_subtitle_customer')"
    />

    <p v-if="status" class="status status-error">{{ status }}</p>
  </div>
</template>
