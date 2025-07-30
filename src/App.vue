<template>
  <v-app>
    <v-main>
      <Main />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore();


onMounted(async () => {
  // Loads monitors (and events if in event feed page) after browser refresh.
  if(sessionStorage.getItem('apiKey')){
    if(appStore.demoMode){
      await appStore.fetchDemoMonitors();      // read demoData.JSON
      }
      else {
        await appStore.fetchMonitors();
      }
  }
})

</script>

<style>
html {
  overflow-y: auto !important;
}
</style>