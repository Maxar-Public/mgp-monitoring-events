<template>
  <v-container fluid class="monitor-manager">
    <v-row justify="center" no-gutters>
      <v-col cols="12" md="10" class="pa-0">
        <div class="header-container mb-6">
          <div class="d-flex justify-space-between align-center mb-2">
            <h2>Monitor Manager</h2>
          </div>
          <v-divider></v-divider>
        </div>

        <v-card class="pa-6 content-card" elevation="2">
          <div class=" pb-4 map-container">
            <div id="map" style="height: 300px;"></div>
          </div>

          <!-- Search Bar -->
          <div class="d-flex justify-space-between align-center mb-4 search-bar-wrapper">
            <v-btn v-if="selectedMonitor" 
              class="see-details-btn"  
              size="small" 
              variant="tonal"
              @click="appStore.setMonitorDetails(true)">
              See Monitor Details
            </v-btn>

            <v-text-field 
              v-model="search" 
              label="Search" 
              variant="outlined" 
              prepend-inner-icon="mdi-magnify"
              density="compact" 
              class="search-field">
            </v-text-field>
          </div>

          <div class="table-container">
            <v-data-table 
              :headers="headers" 
              :items="appStore.monitors" 
              :search="search"
              :sort-by="[{ key: 'id', order: 'asc' }]" 
              item-value="id" 
              class="styled-table"
              density="compact">
              <template v-slot:item="{ item }">
                <tr @click="displayMonitorDetails(item)" :class="{ 'selected-row': selectedMonitor?.id === item.id }"
                  style="cursor: pointer;">
                  <td>{{ item.id }}</td>
                  <td>{{ item.metadata.store_name }}</td>
                  <td>{{ item.metadata.address }}</td>
                  <td>{{ item.date_modified }}</td>
                  <td>
                    <div class="switch-container">
                      <v-switch :model-value="item.enabled" color="green" :loading="loadingMonitorId === item.id"
                        :disabled="loadingMonitorId === item.id || refreshLoading" @click.stop="toggleMonitor(item)" />
                      <v-btn class="edit-button" @click.stop="openDialog(item)" size="x-small" icon>
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                    </div>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <MonitorDetails :monitor="selectedMonitor" />
    <updateMonitor />
    <Banner />
  </v-container>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { ref, onMounted, watch } from "vue";
import { useAppStore } from "@/stores/app";
import L from "leaflet";
import type { Monitor } from '@/types/FetchMonitorInterface';

const appStore = useAppStore();
const router = useRouter();

const selectedMonitor = ref<Monitor | null>(null)
const search = ref("");
const loadingMonitorId = ref(null);
const refreshLoading = ref(false);

let map: L.Map | null = null;
let bboxLayer: L.Layer | null = null;

const headers = [
  { title: "Monitor ID", key: "id", sortable: true },
  { title: "Store Name", key: "metadata.store_name", sortable: true },
  { title: "Location", key: "address", sortable: true },
  { title: "Latest Update", key: "date_modified", sortable: true },
  { title: "Actions", key: "enabled", sortable: false },
];

onMounted(async () => {
  
  appStore.clearBanner();

  if (!map) {
    map = L.map("map", {
    zoomControl: false,
    maxBounds: [
      [-90, -180],
      [90, 180],
    ],
    minZoom: 2,
  }).setView([39.87, -105.045], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
  }

  if(appStore.demoMode){
    // read demoData.JSON
    await appStore.fetchDemoMonitors();

  }
  else{
    await appStore.fetchMonitors();
  }

  if (appStore.monitorRefresh) {
    appStore.monitorManagerRefresh(false);
  }



});



const displayMonitorDetails = (monitor: any) => {
  if (!map || !monitor.aoi_geojson?.coordinates?.length) return;

  if (bboxLayer) {
    map.removeLayer(bboxLayer);
  }

  const coordinates = monitor.aoi_geojson.coordinates[0];
  const latLngs: [number, number][] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

  const bounds = L.latLngBounds(latLngs);
  bboxLayer = L.rectangle(bounds, { color: "#ff7800", weight: 1, fillOpacity: 0.1 }).addTo(map);
  map.fitBounds((bboxLayer as L.Polygon).getBounds());

  selectedMonitor.value = monitor; 
};

// Function to open the update monitor modal
const openDialog = (monitor: any) => {
  appStore.setMonitorForUpdate(monitor);
  appStore.toggleUpdateMonitorModal(true);
};

const toggleMonitor = async (monitor: any) => {
  if (loadingMonitorId.value === monitor.id) return; 

  const previousState = monitor.enabled;
  monitor.enabled = !monitor.enabled;
  loadingMonitorId.value = monitor.id;

  try {
    const action = monitor.enabled ? "enable" : "disable";
    const response = await appStore.toggleMonitorStatus(monitor.id, action);
    appStore.clearBanner();
    if (response.ok){
      
      appStore.setBanner("success", `Monitor ${monitor.id} ${action}d successfully`);
    }
    else {
      
      const errorData = await response.json();
      appStore.setBanner("error", errorData.error.error_messages || "Failed to enable monitor.");
      monitor.enabled = previousState; 
    }
    
  } catch (error: any) {
    monitor.enabled = previousState; 
    appStore.setBanner("error", `Error toggling monitor: ${error.message}`);
  } finally {
    loadingMonitorId.value = null; 
  }
};

watch(
  () => appStore.monitorRefresh,        
  async (newVal: boolean, oldVal: boolean) => {
    if (newVal === true && oldVal == false) {
      refreshLoading.value = true;

      if(appStore.demoMode){
      await appStore.fetchDemoMonitors();      // read demoData.JSON
      }
      else {
        await appStore.fetchMonitors();
      }

      appStore.monitorManagerRefresh(false);
      refreshLoading.value = false;

      if (selectedMonitor.value) {
        const updatedMonitor = appStore.monitors.find(m => m.id === selectedMonitor.value?.id);
        if (updatedMonitor) {
          selectedMonitor.value = updatedMonitor;
        }
      }
    }
  }
);

</script>

<style scoped>
.monitor-manager {
  display: flex;
  flex-direction: column;
  padding-bottom: 40px; 
  overflow-x: hidden;
}

.content-card {
  display: flex;
  flex-direction: column;
  height: auto;
  padding-bottom: 40px;
  overflow: visible;
}

.map-area {
  background-color: #E3E6EA;
  border-radius: 8px;
  width: 100%;
  min-height: 200px;
}


.styled-table {
  width: 100%;
  min-height: 680px;
}

.styled-table thead th {
  color: #AAAAAA;
  font-weight: 500;
  padding: 12px;
}

.styled-table th,
.styled-table td {
  padding: 4px 8px; 
  font-size: 14px;
}

.v-data-table .v-data-table__wrapper tbody tr {
  min-height: 36px !important;
}


.v-table__wrapper {
  overflow-y: visible !important;
  height: auto !important;
  max-height: none !important;
  flex: initial !important;
  display: block !important;
}

.v-switch {
  height: 55px !important;
  transform: scale(.88); 
}

.v-switch .v-input__control {
  min-height: 28px !important;
  height: 28px !important;
}

.v-data-table {
  border-collapse: collapse;
  width: 100%;
  max-height: none !important;
}

.v-data-table th {
  padding: 8px;
}

.v-data-table td {
  padding: 4px 8px; 
}

.styled-table tbody tr:nth-child(even) {
  background-color: #f8f8f8;
}

.styled-table tbody tr:hover {
  background-color: #e0e0e0;
}

.switch-container {
  display: flex;
  align-items: center;  
  justify-content: center; 
  height: 100%; 
  width: 100%; 
}

.styled-table td {
  vertical-align: middle !important; 
  height: 40px !important; 
}

.table-container {
  height: auto !important;
  overflow: visible !important;
  max-height: none !important;
}

.edit-button {  
  margin: 10%;
}
 
.search-bar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.see-details-btn {
  height: 40px;
  align-self: center;
}

.search-field {
  max-width: 300px;
  margin-left: auto;
  height: 40px;
}

.selected-row {
  background-color: #f8d6b9 !important; /* #c8e9b7 */
}
</style>
