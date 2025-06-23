
<template>
  <v-container fluid class="event-feed">
    <v-row justify="center" no-gutters>
      <v-col cols="12" md="10" class="pa-0">
        <div class="header-container mb-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <h2>Event Feed</h2>
            <v-btn size="small" variant="tonal" @click="refresh" class="mb-3">
              REFRESH
            </v-btn>
          </div>
          <v-divider></v-divider>
        </div>
        <v-card class="content-card" elevation="2">
          <div>
            <div class="filter-wrap">
              <!-- Dropdown Type Filter -->
              <v-select
                v-model="selectedType"
                :items="roles"
                item-title="label"
                item-value="value"
                label="Event Type"
                prepend-inner-icon="mdi-filter-variant"
                density="compact"
                style="width: 200px"
              ></v-select>

              <!-- Date range from -->
              <v-text-field
                v-model="dateRangeFrom"
                label="Date from"
                type="date"
                :max="dateRangeTo || today"
                density="compact"
              ></v-text-field>

              <!-- Date range to -->
              <v-text-field
                v-model="dateRangeTo"
                label="Date to"
                type="date"
                :min="dateRangeFrom"
                :max="today"
                density="compact"
              ></v-text-field>
            </div>
            <div class="filter-wrap">
              <!-- Search Bar -->
              <v-text-field
                v-model="search"
                density="compact"
                label="Search"
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                flat
                hide-details
                single-line
              ></v-text-field>
              <v-btn size="small" variant="plain" @click="resetValues" class="mb-3">
                Reset filters
              </v-btn>
            </div>
          </div>
          <div>
            <h4>Events</h4>
            <v-divider></v-divider>
            <v-skeleton-loader v-if="isTableLoading" type="list-item-avatar" />
            <div v-if="filteredEvents.length === 0 && !isTableLoading" class="empty-container">
              <v-icon color="grey" icon="mdi-information" size="x-large"></v-icon>
              <p style="color:grey">No events found</p>
            </div>

            <v-data-table
              v-else-if="filteredEvents.length > 0 && !isTableLoading"
              :items="filteredEvents"
              :search="search"
              item-value="id"
              hide-default-header
              class="styled-table"
            >
              <template v-slot:item="{ item }">
                <tr
                  @click="openPopup(item)"
                  @mouseover="highlightEvent(item)"
                  @mouseleave="unhighlightEvent"
                  style="cursor: pointer;"
                >
                  <td>
                    <div class="event-container">
                      <!-- Image -->
                      <v-avatar v-if="appStore.eventImagesMap.get(item.metadata.event.event_id)" class="square-image">
                        <v-img :src="appStore.eventImagesMap.get(item.metadata.event.event_id)" alt="Image" max-width="50" max-height="50"></v-img>
                      </v-avatar>
                      <v-avatar v-else-if="appStore.eventImagesMap.get(item.id) === 'noImage'" class="square-image">
                        <v-img :src="imagePlaceholder" alt="Image" max-width="50" max-height="50"></v-img>
                      </v-avatar>
                      <v-avatar v-else>
                        <v-progress-circular indeterminate color="grey"></v-progress-circular>
                      </v-avatar>
                      <div>
                        <v-list-item-title class="font-weight-bold">{{ item.store_name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.market_segment }}</v-list-item-subtitle>
                        <v-list-item-subtitle class="text-grey-darken-1">
                          <strong>Address:</strong> {{ item.address }}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle class="text-grey-darken-1">
                          <strong>Type:</strong> {{ item.type }} • <strong>Timestamp:</strong> {{ item.event_timestamp }}
                        </v-list-item-subtitle>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <MetadataPopup 
    @popup-closed="unhighlightSelectedEvent"
  />

</template>

<script lang="ts" setup>
import { useAppStore } from "@/stores/app";
import { ref, computed, watch, onMounted } from 'vue';
import imagePlaceholder from "@/assets/noImage.png";
import { useAuthStore } from "@/stores/auth";

const appStore = useAppStore();
const authStore = useAuthStore()

const isTableLoading = ref(false);

// Filter parameters
const todayMaxTime = new Date();
todayMaxTime.setHours(23, 59, 59, 999);
const today = todayMaxTime.toISOString().split('T')[0];
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
const oneYearAgoString = oneYearAgo.toISOString().split('T')[0];
const dateRangeFrom = ref(oneYearAgoString);
const dateRangeTo = ref(today);
const search = ref('');
const selectedType = ref('');

//Filtering Logic
const filteredEvents = computed(() => {
  return appStore.monitorEvents
    .filter((event) => {
      //Filtering by type
      if (selectedType.value && event.type !== selectedType.value) {
        return false;
      }
      return true;
    })
    .filter((event) => {
      //Filtering by search input - search only in store_name, address, and market_segment
      const query = search.value.toLowerCase().trim();
      if (!query) return true;

      return (
        event.store_name.toLowerCase().includes(query) ||
        event.address.toLowerCase().includes(query) ||
        event.market_segment.toLowerCase().includes(query)
      );
    })
    .filter((event) => {
      //Filtering by date range
      const itemDate = new Date(event.event_timestamp);
      const start = dateRangeFrom.value ? new Date(dateRangeFrom.value) : null;
      const end = dateRangeTo.value ? new Date(dateRangeTo.value) : null;
      return (!start || itemDate >= start) && (!end || itemDate <= end);
    });
});

const roles = ref([
  { label: 'All Types', value: '' }, // Default option
  { label: 'Match', value: 'match' },
  { label: 'Admin Events', value: 'patch' },
]);

onMounted(() => {  
  if (!authStore.isTokenValid()) {
    console.warn('Token invalid, redirecting to login...')
    authStore.showLoginModal = true;
  } else {
  }
  appStore.clearBanner();

  refresh();
});

// Fetches all the recent events 
const refresh = () => {
  if(appStore.monitors.length){
      isTableLoading.value = true;
      appStore.fetchAllEvents();      
  }
  else {
    appStore.monitorEvents.splice(0, appStore.monitorEvents.length);
    appStore.eventImagesMap.clear();
    appStore.eventSourcesMap.clear();
  }
};

const resetValues = () => {
  selectedType.value = '';
  dateRangeFrom.value = oneYearAgoString; 
  dateRangeTo.value = today;
  search.value = ''; 
};

const highlightEvent = (event: any) => {
  appStore.hoveredEvent = event;
};

const unhighlightEvent = () => {
  appStore.hoveredEvent = null;
};

const openPopup = (event: any) => {
  if(appStore.selectedEvent != event) {
    appStore.selectedEvent = event;
  }
  else {
    unhighlightSelectedEvent();
  }
};

const unhighlightSelectedEvent = () => {
  appStore.selectedEvent = null;
};

watch(() => appStore.monitorEvents, () => {
  isTableLoading.value = false;
});

// When new monitors are fetched the event feed automatically refreshes
watch(() => appStore.monitors, () => {
  refresh();
});
</script>

<style scoped>
.event-feed {
  display: flex;
  flex-direction: column;
  padding-bottom: 40px; 
  overflow-x: hidden;

}

.content-card {
  padding: 30px 20px 10px;
  display: flex;
  flex-direction: column;
  row-gap: 30px;
}

.filter-wrap {
  display: flex;
  column-gap: 3rem;
  align-items: center;
  padding-bottom: 10px;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  text-align: center;
}

.styled-table {
  padding: 20px 0px;
}

.styled-table tbody tr:nth-child(odd) {
  background-color: #f8f8f8;
}

.styled-table tbody tr:hover {
  background-color: #e0e0e0;
}

.event-container {
  display: flex;
  align-items: center;
  column-gap: 20px;
  padding: 10px 0px;
}
</style>
