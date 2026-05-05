<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  buttonText: string
  nameLabel: string
  items: any[]
  form: { name: string; default_price: number }
}>()

const { t } = useLang()
const { formatMoney } = useApi()

const emit = defineEmits<{
  submit: []
  delete: [id: number]
}>()

</script>

<template>
  <section class="panel">
    <h2>{{ title }}</h2>
    <p class="subtitle">{{ subtitle }}</p>
    <form class="form-grid compact" @submit.prevent="emit('submit')">
      <label>
        {{ nameLabel }}
        <input v-model="form.name" required />
      </label>
      <label>
        {{ t("common.price") }}
        <input v-model.number="form.default_price" type="number" min="0" step="0.01" required />
      </label>
      <div class="wide actions">
        <button type="submit">{{ buttonText }}</button>
      </div>
    </form>

    <div class="chips">
      <div v-for="item in items" :key="item.id" class="chip">
        <div>
          <strong>{{ item.name }}</strong>
          <small>{{ formatMoney(item.default_price) }}</small>
        </div>
        <button class="danger" @click="emit('delete', item.id)">{{ t("common.delete") }}</button>
      </div>
    </div>
  </section>
</template>
