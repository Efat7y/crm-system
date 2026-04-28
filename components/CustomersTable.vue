<script setup lang="ts">
defineProps<{
  customers: any[]
  formatMoney: (value: number | null | undefined) => string
  page: number
  totalPages: number
  search: string
}>()

const { t } = useLang()

const emit = defineEmits<{
  updateSearch: [value: string]
  search: []
  prev: []
  next: []
  edit: [id: number]
  remove: [id: number]
}>()

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit("updateSearch", target?.value || "")
}
</script>

<template>
  <section class="panel">
    <h2>{{ t("customer.table.title") }}</h2>
    <div class="toolbar">
      <input
        :value="search"
        :placeholder="t('customer.table.search_placeholder')"
        @input="onSearchInput"
        @keydown.enter.prevent="emit('search')"
      />
      <button @click="emit('search')">{{ t("common.search") }}</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t("customer.table.id") }}</th>
            <th>{{ t("customer.table.name") }}</th>
            <th>{{ t("customer.table.phone") }}</th>
            <th>{{ t("customer.table.email") }}</th>
            <th>{{ t("customer.table.balance") }}</th>
            <th>{{ t("customer.table.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!customers.length">
            <td colspan="6">{{ t("customer.table.no_customers") }}</td>
          </tr>
          <tr v-for="customer in customers" :key="customer.id">
            <td>{{ customer.id }}</td>
            <td>{{ customer.name }}</td>
            <td>{{ customer.phone || "-" }}</td>
            <td>{{ customer.email || "-" }}</td>
            <td>{{ formatMoney(customer.balance_due) }}</td>
            <td>
              <div class="row-actions">
                <NuxtLink :to="`/customers/${customer.id}`" class="link-btn">{{ t("customer.table.ledger") }}</NuxtLink>
                <button class="ghost" @click="emit('edit', customer.id)">{{ t("common.edit") }}</button>
                <button class="danger" @click="emit('remove', customer.id)">{{ t("common.delete") }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button class="ghost" :disabled="page <= 1" @click="emit('prev')">{{ t("common.previous") }}</button>
      <span>{{ t("customer.table.page") }} {{ page }} / {{ totalPages }}</span>
      <button class="ghost" :disabled="page >= totalPages" @click="emit('next')">{{ t("common.next") }}</button>
    </div>
  </section>
</template>
