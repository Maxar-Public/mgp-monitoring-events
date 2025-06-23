<template>
  <div>
    <v-card class="sidebar">
      <v-card-title class="text-black title-bar">Monitoring</v-card-title>
      <v-card-text class="text-black sidebar-content">
        
        <!-- Buttons -->
        <v-card-actions class="action-buttons-top">
        </v-card-actions>

        <!-- Vertical Tabs Navigation -->
        <v-tabs v-model="tab" direction="vertical" class="nav-tabs">
          <v-tab prepend-icon="mdi-map" to="/">Map</v-tab>
          <v-tab prepend-icon="mdi-account-cog" to="/manager">Monitor Manager</v-tab>
          <v-tab prepend-icon="mdi-table" to="/events">Event Feed</v-tab>
        </v-tabs>
      </v-card-text>   
      <v-switch
        class="nav-tabs font-weight-bold demo-mode-switch"
        v-model="demoSwitch"
        color="green"
        label="Demo Mode"
        inset
        @click.stop="toggleDemoMode(!demoSwitch)"
      /> 
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useAppStore } from '@/stores/app';

const mapStore = useAppStore();
const tab = ref(0);
const demoSwitch = ref(mapStore.demoMode);

 const toggleDemoMode = (demoModeStatus: boolean) => {
  mapStore.toggleDemoMode(demoModeStatus);
  mapStore.monitorManagerRefresh(true);
  if(demoModeStatus){
    mapStore.setBanner("success", "Demo Mode ON: Showing simulated monitors.");
  }
  else {
    mapStore.setBanner("warning", "Demo Mode OFF: Fetching Monitors from API.");
  }
  

} 

</script>

<style scoped>
.sidebar {
  width: 300px;
  height: 100vh;
  overflow: auto;
  background-color: #EEF2EC;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #cfcfcf;
  padding: 16px; /* Ensure proper spacing */
}

.sidebar-content {
  padding: 8px 0; /* Reduce padding to remove excess space */
}

.nav-tabs {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: 12px; /* Adjust to align tabs properly */
}

.nav-tabs {
  display: flex;
  flex-direction: column;
  align-items: start;
}

.action-buttons-top {
  display: flex;
  justify-content: flex-start;
  padding: 0;
}

.action-buttons-bottom {
  justify-content: space-between;
  display: flex;
  margin: 0 10px;
}

.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tight-row, .tight-col {
  margin: 0;
  padding: 0;
}
</style>