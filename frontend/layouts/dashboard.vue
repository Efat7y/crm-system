<template>
  <div class="app-shell grid grid-cols-1 gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:grid-cols-[280px_minmax(0,1fr)]">
    <AppNav />
    <div class="app-content min-w-0">
      <slot />
    </div>
  </div>
</template>
