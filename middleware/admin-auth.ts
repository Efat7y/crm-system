export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  await auth.initAuth()

  if (!auth.user.value) {
    return navigateTo("/login")
  }

  if (auth.user.value.role !== "admin") {
    return navigateTo("/portal")
  }
})
