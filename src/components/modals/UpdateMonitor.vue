<template>
    <v-container class="fill-height d-flex align-center justify-center">
      <v-dialog v-model="appStore.updateMonitorModal" max-width="600px">
        <v-card class="card-container">
          <div class="modal-header">
            <v-card-title class="headline">Update Monitor</v-card-title>
            <v-btn variant="flat" @click="closeDialog" class="close-btn">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>

          <v-card-text class="card-content">
<!-- Monitor Start datetime -->
        <v-text-field
          v-model="startLocalValue"
          label="Monitor Start Date"
          type="date"
          variant="underlined"
          @change="updateStartISO"
          :disabled="appStore.selectedMonitorUpdate?.enabled || loading || started || ended"
        ></v-text-field>

        <!-- Monitor End datetime -->
        <v-text-field
          v-model="endLocalValue"
          label="Monitor End Date"
          type="date"
          variant="underlined"
          @change="updateEndISO"
          :disabled="loading || ended"
        ></v-text-field>



            <v-text-field
              v-model="description"
              label="Description of the Monitor"
              type="text"
              variant="underlined"
              :disabled="loading"
            ></v-text-field>
  
            <!-- Market Info -->
          <div>
            <v-label style="margin-top: 30px;">Market Information</v-label>
            <div>
              <!-- Store Name -->
              <v-text-field
                v-model="storeName"
                label="Store Name*"
                type="text"
                variant="underlined"
                :rules="[(v) => !!v || 'Store Name is required']"
                :disabled="loading"
              ></v-text-field>

              <!-- Store Address -->
              <v-text-field
                v-model="storeAddress"
                label="Store Address"
                type="text"
                variant="underlined"
                density="compact"
                :disabled="loading"
              ></v-text-field>

              <!-- Market Segment -->
              <v-select
                v-model="marketSegment"
                :items="marketSegmentOptions"
                label="Market Segment"
                variant="underlined"
                density="compact"
                :disabled="loading"
                clearable
              ></v-select>
            </div>
          </div>
          </v-card-text>
          <v-card-actions class="action-buttons">
            <v-btn @click="closeDialog">Cancel</v-btn>
            <v-btn variant="tonal" 
            @click="updateMonitor"
            :disabled="loading || ended || appStore.demoMode"
            >
            <v-progress-circular
              v-if="loading"
              indeterminate
              color="black"
              :size="24"
            />
            <span v-else>Update</span>
          </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { useAppStore } from "@/stores/app";
  import { ref, watch } from "vue";
  
  const appStore = useAppStore();
  const monitorId = ref('');
  const description = ref('');
  const storeName = ref("");
  const storeAddress = ref("");
  const marketSegment = ref("");

  const marketSegmentOptions = [
    "Commerce Center",
    "Retail",
    "Warehouse Store",
    "Department store",
    "Pharmacy",
    "Restaurant",
    "Professional Services",
    "Other"
  ]

  const loading = ref(false);
  const started = ref(false);
  const ended = ref(false);
  
  // These store the raw string from the <input type="datetime-local">
const startLocalValue = ref('');
const endLocalValue = ref('');

// These will store the final ISO strings (e.g. "2023-02-18T12:00:00.000Z")
const startISO = ref('');
const endISO = ref('');

function updateStartISO() {
  if (!startLocalValue.value) {
    startISO.value = '';
    return
  }
  const dateObj = new Date(startLocalValue.value)
  startISO.value = dateObj.toISOString()
}

function updateEndISO() {
  if (!endLocalValue.value) {
    endISO.value = ''
    return
  }
  const dateObj = new Date(endLocalValue.value)
  endISO.value = dateObj.toISOString()
}

/**
 * Convert an ISO 8601 string (e.g. "2025-03-01T00:00:00Z") to "YYYY-MM-DD"
 */
 function isoToYyyyMmDd(isoString: string): any {
  if(!isoString){
    return null;
  }
  const dateObj: Date = new Date(isoString)
  const y: number = dateObj.getUTCFullYear()
  const m: string = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
  const d: string = String(dateObj.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

  const closeDialog = () => {
    appStore.setMonitorForUpdate(null);
    appStore.toggleUpdateMonitorModal(false);

  };

  const updateMonitor = async () => {
    loading.value = true;

    const requestBody: Record<string, any> = {

      description: description.value,
      metadata: {
      store_name: storeName.value,
      address: storeAddress.value,
      market_segment: marketSegment.value,
      creator_key: sessionStorage.getItem('apiKeyHash')
    }
    };
    // If the user provided a new start date, append it
     if (startISO.value) {
      requestBody.start_datetime = startISO.value
    } 

    // If the user provided a new end date, append it
     if (endISO.value != '') {
      requestBody.end_datetime = endISO.value
    }  
    

    try {
      const apiKey = sessionStorage.getItem('apiKey');
      const response = await fetch(
        `https://api.maxar.com/monitoring/v1/monitors/${monitorId.value}?maxar_api_key=${apiKey}`,
      {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      }
      );

      if (response.ok) {
        appStore.setBanner("success", "Monitor updated successfully!");
        appStore.monitorManagerRefresh(true);
        closeDialog();
      } else {
        const errorData = await response.json();
        appStore.setBanner("error", errorData.error.error_messages || "Failed to update monitor.");
      }
      loading.value = false;
    } catch (error) {
      appStore.setBanner("error", "Network error. Please try again.");
      loading.value = false;
    }
  };

  // Whenever the selected monitor changes, update values 
  watch(() => appStore.selectedMonitorUpdate,() => {
      description.value = appStore.selectedMonitorUpdate?.description ?? '';
      storeName.value = appStore.selectedMonitorUpdate?.metadata.store_name ?? '';
      storeAddress.value = appStore.selectedMonitorUpdate?.metadata.address ?? '';
      marketSegment.value = appStore.selectedMonitorUpdate?.metadata.market_segment ?? '';
      monitorId.value = appStore.selectedMonitorUpdate?.id;
      startLocalValue.value = isoToYyyyMmDd(appStore.selectedMonitorUpdate?.start_datetime);
      endLocalValue.value = isoToYyyyMmDd(appStore.selectedMonitorUpdate?.end_datetime);
  }
);

// Determine if monitor has started
watch(() => appStore.selectedMonitorUpdate?.start_datetime,() => {
  if(!appStore.selectedMonitorUpdate?.start_datetime){
    started.value = true;
    return;
  }

  const today = new Date();
  const startDate = new Date(appStore.selectedMonitorUpdate?.start_datetime);
  if(startDate > today){
    started.value = false;
  }

});

// Determine if monitor has ended
watch(() => appStore.selectedMonitorUpdate?.end_datetime,() => {
  if(!appStore.selectedMonitorUpdate?.end_datetime){
    ended.value = false;
    return;
  }

  const today = new Date();
  const endDate = new Date(appStore.selectedMonitorUpdate?.end_datetime);
  if(endDate < today){
    ended.value = true;
  }

});

 watch(startLocalValue, (newVal, oldVal) => {
  if (!newVal || newVal == isoToYyyyMmDd(appStore.selectedMonitorUpdate?.start_datetime)) {
    return
  } 

  // Parse the chosen date (midnight local time).
  const selectedDate = new Date(newVal)

  // Get today's date, but zero out the time so we compare purely by date.
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // If user picked a date before 'today', revert to the old value.
  if (selectedDate < today) {
    appStore.setBanner("error", "Error: You cannot select yesterday's date or earlier");
    // revert
    startLocalValue.value = oldVal || ''
    return
  }

}) 


watch(endLocalValue, (newVal, oldVal) => {
  if (!newVal || newVal == isoToYyyyMmDd(appStore.selectedMonitorUpdate?.end_datetime)) {
    return
  } 

  // Parse the chosen date (midnight local time).
  const selectedDate = new Date(newVal)

  // Get today's date, but zero out the time so we compare purely by date.
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // If user picked a date before 'today', revert to the old value.
  if (selectedDate < today) {
    appStore.setBanner("error", "Error: You cannot select yesterday's date or earlier");
    // revert
    endLocalValue.value = oldVal || ''
    return
  }

})



  
  </script>
  
  <style>
  .card-container {
    padding: 20px;
  }
  
  .card-content {
    display: flex;
    flex-direction: column;
    row-gap: 15px;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px 0px 15px;
  }
  
  .options {
    display: flex;
    justify-content: space-between;
    column-gap: 20%;
  }
  
  .checkbox-spacing {
    height: 20px;
  }
  
  .action-buttons {
    margin: 10px;
  }
  </style>