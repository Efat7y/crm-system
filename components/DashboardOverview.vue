<script setup lang="ts">
const props = defineProps<{
  data: any
  formatMoney: (value: number | null | undefined) => string
}>()

const { t, language } = useLang()

function movementTypeLabel(value: string) {
  if (value === "order") return t("kpi.order")
  if (value === "payment") return t("kpi.payment")
  return t("kpi.item_movement")
}
</script>

<template>
  <section class="grid">
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
            </tr>
          </thead>
          <tbody>
            <tr v-if="!props.data?.top_debtors?.length">
              <td colspan="4">{{ t("common.no_data") }}</td>
            </tr>
            <tr v-for="row in props.data?.top_debtors || []" :key="row.id">
              <td>{{ row.name }}</td>
              <td>{{ props.formatMoney(row.total_items_amount) }}</td>
              <td>{{ props.formatMoney(row.total_paid_amount) }}</td>
              <td>{{ props.formatMoney(row.balance_due) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
