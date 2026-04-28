export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  await auth.initAuth()
})
