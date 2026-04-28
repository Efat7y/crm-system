<script setup lang="ts">
const model = defineModel<any>({ required: true })

defineProps<{
  isEdit: boolean
}>()

const { t } = useLang()

const emit = defineEmits<{
  submit: []
  reset: []
}>()
</script>

<template>
  <section class="panel">
    <h2>{{ t("customer.form.title") }}</h2>
    <form class="form-grid" @submit.prevent="emit('submit')">
      <label>
        {{ t("customer.form.name") }}
        <input v-model="model.name" required />
      </label>
      <label>
        {{ t("customer.form.phone") }}
        <input v-model="model.phone" />
      </label>
      <label>
        {{ t("customer.form.email") }}
        <input v-model="model.email" type="email" />
      </label>
      <label>
        {{ t("customer.form.company") }}
        <input v-model="model.company" />
      </label>
      <label class="wide">
        {{ t("customer.form.address") }}
        <input v-model="model.address" />
      </label>
      <label class="wide">
        {{ t("customer.form.notes") }}
        <textarea v-model="model.notes" rows="2" />
      </label>
      <div class="wide actions">
        <button type="submit">{{ isEdit ? t("customer.form.update") : t("customer.form.create") }}</button>
        <button type="button" class="ghost" @click="emit('reset')">{{ t("common.reset") }}</button>
      </div>
    </form>
  </section>
</template>
