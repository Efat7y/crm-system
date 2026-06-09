<script setup lang="ts">
const props = defineProps<{
  data: any
  formatMoney: (value: number | null | undefined) => string
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { t, language } = useLang()
const { request } = useApi()
const quickPayments = reactive<Record<number, { amount: number | null; payment_method: string; saving: boolean }>>({})
const quickPaymentStatus = ref("")

function movementTypeLabel(value: string) {
  if (value === "order") return t("kpi.order")
  if (value === "payment") return t("kpi.payment")
  return t("kpi.item_movement")
}

function getQuickPayment(customerId: number, balanceDue: number) {
  if (!quickPayments[customerId]) {
    quickPayments[customerId] = {
      amount: Number(balanceDue || 0),
      payment_method: "",
      saving: false
    }
  }

  return quickPayments[customerId]
}

async function saveQuickPayment(customerId: number, balanceDue: number) {
  const form = getQuickPayment(customerId, balanceDue)
  const amount = Number(form.amount || 0)

  if (!amount || amount <= 0) {
    quickPaymentStatus.value = t("ledger.amount")
    return
  }

  form.saving = true
  quickPaymentStatus.value = ""

  try {
    await request(`/customers/${customerId}/payments`, {
      method: "POST",
      body: {
        amount,
        payment_method: form.payment_method,
        notes: t("ledger.add_payment")
      }
    })
    form.amount = 0
    form.payment_method = ""
    quickPaymentStatus.value = t("common.added_success")
    emit("refresh")
  } catch (error: any) {
    quickPaymentStatus.value = error.message
  } finally {
    form.saving = false
  }
}
</script>

<template>
  <section class="content-grid">
    <div class="panel kpi">
      <span>{{ t("kpi.customers") }}</span>
      <strong>{{ props.data?.summary?.customers_count ?? 0 }}</strong>
    </div>
    <div class="panel kpi">
      <span>{{ t("kpi.items_total") }}</span>
      <strong>{{ props.formatMoney(props.data?.summary?.items_total_amount) }}</strong>
    </div>
    <div class="panel kpi">
      <span>{{ t("kpi.payments_total") }}</span>
      <strong>{{ props.formatMoney(props.data?.summary?.payments_total_amount) }}</strong>
    </div>
    <div class="panel kpi">
      <span>{{ t("kpi.balance_total") }}</span>
      <strong>{{ props.formatMoney(props.data?.summary?.balance_due_total) }}</strong>
    </div>

    <section class="panel span-2 mt-2">
      <h2>{{ t("kpi.top_debtors") }}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t("kpi.customer") }}</th>
              <th>{{ t("kpi.withdrawn") }}</th>
              <th>{{ t("kpi.paid") }}</th>
              <th>{{ t("kpi.balance") }}</th>
              <th>{{ t("ledger.add_payment") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!props.data?.top_debtors?.length">
              <td colspan="5">{{ t("common.no_data") }}</td>
            </tr>
            <tr v-for="row in props.data?.top_debtors || []" :key="row.id">
              <td>{{ row.name }}</td>
              <td>{{ props.formatMoney(row.total_items_amount) }}</td>
              <td>{{ props.formatMoney(row.total_paid_amount) }}</td>
              <td>{{ props.formatMoney(row.balance_due) }}</td>
              <td>
                <form class="quick-payment-form" @submit.prevent="saveQuickPayment(row.id, row.balance_due)">
                  <input
                    v-model.number="getQuickPayment(row.id, row.balance_due).amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    :max="Number(row.balance_due || 0) || undefined"
                    :aria-label="t('ledger.amount')"
                  />
                  <input
                    v-model="getQuickPayment(row.id, row.balance_due).payment_method"
                    :placeholder="t('ledger.payment_method')"
                    :aria-label="t('ledger.payment_method')"
                  />
                  <button type="submit" :disabled="getQuickPayment(row.id, row.balance_due).saving">
                    {{ getQuickPayment(row.id, row.balance_due).saving ? t("auth.loading") : t("ledger.save_payment") }}
                  </button>
                </form>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="quickPaymentStatus" class="status">{{ quickPaymentStatus }}</p>
    </section>

    <section class="panel span-2">
      <h2>{{ t("kpi.recent") }}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t("kpi.type") }}</th>
              <th>{{ t("kpi.customer") }}</th>
              <th>{{ t("kpi.details") }}</th>
              <th>{{ t("kpi.value") }}</th>
              <th>{{ t("kpi.date") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!props.data?.recent_movements?.length">
              <td colspan="5">{{ t("common.no_data") }}</td>
            </tr>
            <tr v-for="(row, i) in props.data?.recent_movements || []" :key="`${i}-${row.customer_id}`">
              <td>{{ movementTypeLabel(row.movement_type) }}</td>
              <td>{{ row.customer_name }}</td>
              <td>{{ row.title }}</td>
              <td>{{ props.formatMoney(row.amount) }}</td>
              <td>{{ new Date(row.created_at).toLocaleString(language.value === 'ar' ? 'ar-EG' : 'en-US') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
