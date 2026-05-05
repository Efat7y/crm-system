<script setup lang="ts">
const props = defineProps<{
  items: any[]
  formatMoney: (value: number | null | undefined) => string
}>()

const { t } = useLang()

function categoryLabel(category: string) {
  if (category === "fragrance") return t("ledger.category.fragrance")
  if (category === "color") return t("ledger.category.color")
  return t("ledger.category.raw_material")
}
</script>

<template>
  <div class="order-items-table-wrap">
    <table class="order-items-table">
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
        <tr v-if="!props.items.length">
          <td colspan="7" class="empty-cell">{{ t("portal.empty_selected_items") }}</td>
        </tr>
        <tr v-for="(item, index) in props.items" :key="`${item.product_name}-${index}`">
          <td class="item-index">{{ index + 1 }}</td>
          <td>
            <strong class="item-name">{{ item.product_name || "-" }}</strong>
          </td>
          <td>
            <span class="category-chip">{{ categoryLabel(item.category) }}</span>
          </td>
          <td>{{ item.quantity }}</td>
          <td>{{ item.unit || "-" }}</td>
          <td>{{ props.formatMoney(item.unit_price) }}</td>
          <td>
            <strong>{{ props.formatMoney(item.total_amount) }}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
