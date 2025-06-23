<template>
  <v-alert
    v-if="appStore.banner.message"
    :type="appStore.banner.type"
    :text="appStore.banner.message"
    class="banner-container"
    closable
    @click:close="appStore.clearBanner"
  />
</template>

<script lang="ts" setup>
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();
</script>

<style scoped>
.banner-container {
  position: absolute;
  display: flex;
  align-items: center;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  max-width: 50%;
  min-width: 100px;
}
</style>
