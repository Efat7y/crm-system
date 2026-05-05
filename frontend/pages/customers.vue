<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "admin-auth" })

const { request, formatMoney } = useApi()
const { t } = useLang()

const status = ref("")

const page = ref(1)
const limit = ref(10)
const totalPages = ref(1)
const search = ref("")
const customers = ref<any[]>([])

const customerForm = ref({
  id: null as number | null,
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  notes: ""
})

function clearCustomerForm() {
  customerForm.value = {
    id: null,
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: ""
  }
}

async function loadCustomers() {
  const result: any = await request("/customers", {
    query: { page: page.value, limit: limit.value, search: search.value || undefined }
  })
  customers.value = result.data
  totalPages.value = Math.max(result.pagination.totalPages || 1, 1)
}

async function saveCustomer() {
  try {
    const payload = { ...customerForm.value }
    delete (payload as any).id

    if (customerForm.value.id) {
      await request(`/customers/${customerForm.value.id}`, { method: "PUT", body: payload })
    } else {
      await request("/customers", { method: "POST", body: payload })
    }

    status.value = t("customers.saved")
    clearCustomerForm()
    await loadCustomers()
  } catch (error: any) {
    status.value = error.message
  }
}

async function editCustomer(id: number) {
  try {
    customerForm.value = await request(`/customers/${id}`)
  } catch (error: any) {
    status.value = error.message
  }
}

async function removeCustomer(id: number) {
  if (!window.confirm(t("customers.confirm_delete"))) return
  try {
    await request(`/customers/${id}`, { method: "DELETE" })
    status.value = t("customers.deleted")
    await loadCustomers()
  } catch (error: any) {
    status.value = error.message
  }
}

async function searchNow() {
  page.value = 1
  await loadCustomers()
}

function updateSearch(value: string) {
  search.value = value
}

async function prevPage() {
  if (page.value <= 1) return
  page.value -= 1
  await loadCustomers()
}

async function nextPage() {
  if (page.value >= totalPages.value) return
  page.value += 1
  await loadCustomers()
}

onMounted(async () => {
  try {
    await loadCustomers()
  } catch (error: any) {
    status.value = error.message
  }
})
</script>

<template>
  <div>
    <PageHeader :title="t('customers.title')" :subtitle="t('customers.subtitle')" />
    <section class="grid customers-grid">
      <CustomerForm v-model="customerForm" :is-edit="Boolean(customerForm.id)" @submit="saveCustomer" @reset="clearCustomerForm" />
      <CustomersTable
        :customers="customers"
        :format-money="formatMoney"
        :page="page"
        :total-pages="totalPages"
        :search="search"
        @update-search="updateSearch"
        @search="searchNow"
        @prev="prevPage"
        @next="nextPage"
        @edit="editCustomer"
        @remove="removeCustomer"
      />
    </section>
    <p class="status">{{ status }}</p>
  </div>
</template>
