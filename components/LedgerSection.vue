<script setup lang="ts">
defineProps<{
  ledger: any
  selectedCustomerId: number | null
  itemForm: any
  paymentForm: any
  catalogSections: { raw_materials: any[]; fragrances: any[]; colors: any[] }
  formatMoney: (value: number | null | undefined) => string
}>()

const emit = defineEmits<{
  addItem: []
  addPayment: []
  deleteItem: [id: number]
  deletePayment: [id: number]
}>()

const { t, language } = useLang()

function categoryLabel(category: string) {
  if (category === "fragrance") return t("ledger.category.fragrance")
  if (category === "color") return t("ledger.category.color")
  return t("ledger.category.raw_material")
}

function categoryItems(category: string, sections: { raw_materials: any[]; fragrances: any[]; colors: any[] }) {
  if (category === "fragrance") return sections.fragrances
  if (category === "color") return sections.colors
  return sections.raw_materials
}
</script>

<template>
  <section class="panel full">
    <h2>{{ t("ledger.title") }}</h2>
    <p class="subtitle">{{ ledger?.customer?.name ? `${t("ledger.current_customer")}: ${ledger.customer.name}` : t("ledger.select_customer") }}</p>

    <div v-if="ledger?.summary" class="summary-grid">
      <div><span>{{ t("ledger.total_items") }}</span><strong>{{ formatMoney(ledger.summary.total_items_amount) }}</strong></div>
      <div><span>{{ t("ledger.total_paid") }}</span><strong>{{ formatMoney(ledger.summary.total_paid_amount) }}</strong></div>
      <div><span>{{ t("ledger.balance_due") }}</span><strong>{{ formatMoney(ledger.summary.balance_due) }}</strong></div>
    </div>

    <div class="two-columns">
      <form class="form-grid compact panel-soft" @submit.prevent="emit('addItem')">
        <h3 class="wide">{{ t("ledger.add_movement") }}</h3>
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
          <select v-model="itemForm.item_name" required>
            <option disabled value="">{{ t("common.select_item") }}</option>
            <option v-for="item in categoryItems(itemForm.category, catalogSections)" :key="item.id" :value="item.name">
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

      <form class="form-grid compact panel-soft" @submit.prevent="emit('addPayment')">
        <h3 class="wide">{{ t("ledger.add_payment") }}</h3>
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
    </div>

    <div class="two-columns" v-if="ledger">
      <div class="panel-soft">
        <h3>{{ t("ledger.movements") }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t("ledger.item") }}</th>
                <th>{{ t("ledger.category") }}</th>
                <th>{{ t("ledger.quantity") }}</th>
                <th>{{ t("ledger.total") }}</th>
                <th>{{ t("common.delete") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!ledger.items.length">
                <td colspan="5">{{ t("ledger.no_movements") }}</td>
              </tr>
              <tr v-for="item in ledger.items" :key="item.id">
                <td>{{ item.item_name }}</td>
                <td>{{ categoryLabel(item.category) }}</td>
                <td>{{ item.quantity }} {{ item.unit || "" }}</td>
                <td>{{ formatMoney(item.total_amount) }}</td>
                <td><button class="danger" @click="emit('deleteItem', item.id)">{{ t("common.delete") }}</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel-soft">
        <h3>{{ t("ledger.payments") }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t("ledger.amount") }}</th>
                <th>{{ t("ledger.payment_method") }}</th>
                <th>{{ t("ledger.date") }}</th>
                <th>{{ t("common.delete") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!ledger.payments.length">
                <td colspan="4">{{ t("ledger.no_payments") }}</td>
              </tr>
              <tr v-for="payment in ledger.payments" :key="payment.id">
                <td>{{ formatMoney(payment.amount) }}</td>
                <td>{{ payment.payment_method || "-" }}</td>
                <td>{{ new Date(payment.created_at).toLocaleDateString(language.value === 'ar' ? 'ar-EG' : 'en-US') }}</td>
                <td><button class="danger" @click="emit('deletePayment', payment.id)">{{ t("common.delete") }}</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

