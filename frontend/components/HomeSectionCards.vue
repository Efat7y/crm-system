<script setup lang="ts">
const props = defineProps<{
  rawMaterials: any[]
  fragrances: any[]
  colors: any[]
}>()

const { t } = useLang()
const { formatMoney } = useApi()
</script>

<template>
  <section class="panel span-2 mt-2">
    <h2>{{ t("home.title") }}</h2>
    <div class="cards-grid">
      <article class="product-card">
        <h3>{{ t("home.raw_materials") }}</h3>
        <div class="badge">{{ props.rawMaterials.length }} {{ t("home.products_count") }}</div>
        <ul>
          <li v-for="item in props.rawMaterials.slice(0, 6)" :key="item.id">
            <span>{{ item.name }}</span>
            <small>{{ formatMoney(item.default_price) }}</small>
          </li>
          <li v-if="props.rawMaterials.length === 0">{{ t("home.no_raw_materials") }}</li>
        </ul>
      </article>

      <article class="product-card">
        <h3>{{ t("home.fragrances") }}</h3>
        <div class="badge">{{ props.fragrances.length }} {{ t("home.products_count") }}</div>
        <ul>
          <li v-for="item in props.fragrances.slice(0, 6)" :key="item.id">
            <span>{{ item.name }}</span>
            <small>{{ formatMoney(item.default_price) }}</small>
          </li>
          <li v-if="props.fragrances.length === 0">{{ t("home.no_fragrances") }}</li>
        </ul>
      </article>

      <article class="product-card">
        <h3>{{ t("home.colors") }}</h3>
        <div class="badge">{{ props.colors.length }} {{ t("home.products_count") }}</div>
        <ul>
          <li v-for="item in props.colors.slice(0, 6)" :key="item.id">
            <span>{{ item.name }}</span>
            <small>{{ formatMoney(item.default_price) }}</small>
          </li>
          <li v-if="props.colors.length === 0">{{ t("home.no_colors") }}</li>
        </ul>
      </article>
    </div>
  </section>
</template>
