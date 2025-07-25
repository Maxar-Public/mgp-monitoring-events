<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-dialog v-model="appStore.createMonitorModal" max-width="750px" persistent>
      <v-card class="card-container">
        <div class="modal-header">
          <v-card-title>Create Monitor</v-card-title>
          <v-btn variant="flat" @click="closeDialog" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-text class="card-content">
          <v-text-field
            v-model="description"
            label="Description of the Monitor"
            type="text"
            variant="underlined"
            density="compact"
          ></v-text-field>

          <!-- AOI -->
          <v-text-field
            label="Area of Interest (Bbox)"
            type="text"
            variant="underlined"
            v-model="formattedBbox"
            readonly
            density="compact"
          ></v-text-field>

          <div>
            <v-label style="padding-bottom: 10px">
              Match Criteria&nbsp;<span style="font-size: 12px;">(required)</span>
            </v-label>
            <div class="options">
              <!-- AOI Coverage Percentage -->
              <v-text-field
                  v-model="aoiCoveragePercent"
                  label="Min AOI Coverage (%)"
                  variant="underlined"
                  placeholder="Range between 1 and 100"
                  type="number"
                  :rules="[(v) => validateAoiCoveragePercent(v)]"
                  :step="0.01"
                  @keypress="restrictInput" 
                  class="match-criteria-input">
                </v-text-field>
               
              <!-- Area cloud coverage -->
                 <v-text-field
                    v-model="areaCloudCoverage"
                    label="Max Cloud Coverage (%) *"
                    variant="underlined"
                    placeholder="Range between 0 and 100"
                    type="number"
                    :rules="[(v) => validateCloudCoverage(v)]"
                    :step="0.01"
                    @keypress="restrictInput" 
                    class="match-criteria-input">
                  </v-text-field>              

              <!-- Off nadir angle -->
                <v-text-field
                  v-model="offNadirAngle"
                  label="Max Off-Nadir Angle *"
                  variant="underlined"
                  placeholder="Range between 0 and 90"
                  type="number"
                  :rules="[(v) => validateOffNadirAngle(v)]"
                  :step="0.01"
                  @keypress="restrictInput"
                  class="match-criteria-input">
                </v-text-field>
            </div>
            
          </div>

          <!-- platform -->
          <div class="sources-container">
            <v-label>Platform(s) - Satellite sources</v-label>
            <v-row>
              <v-col
                cols="6"
                v-for="(platform, index) in appStore.platformList"
                :key="index"
              >
                <v-checkbox
                  v-model="selectedPlatforms"
                  :value="platform"
                  hide-details
                  dense
                  class="checkbox-spacing"
                  density="compact"
                >
                  <template v-slot:label>
                    <span
                      :style="{
                        color: selectedPlatforms.includes(platform)
                          ? '#212121'
                          : '#9e9e9e',
                      }"
                    >
                      {{ platform }}
                    </span>
                  </template>
                </v-checkbox>
              </v-col>
            </v-row>
          </div>

          <!-- Market Info -->
          <div>
            <v-label style="margin-top: 30px;">Market Information</v-label>
            <div>
              <!-- Store Name -->
              <v-text-field
                v-model="storeName"
                label="Store Name *"
                type="text"
                variant="underlined"
                :rules="[(v) => !!v || 'Store Name is required']"
              ></v-text-field>

              <!-- Store Address -->
              <v-text-field
                v-model="storeAddress"
                label="Store Address"
                type="text"
                variant="underlined"
                density="compact"
              ></v-text-field>

              <!-- Market Segment -->
              <v-select
                v-model="marketSegment"
                :items="marketSegmentOptions"
                label="Market Segment"
                variant="underlined"
                density="compact"
                clearable
              ></v-select>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="action-buttons">
          <v-btn @click="closeDialog">Cancel</v-btn>
          <v-btn variant="tonal" 
            @click="createMonitor" 
            :disabled="loading || !isValidForm"
          >
            <v-progress-circular
              v-if="loading"
              indeterminate
              color="black"
              :size="24"
            />
            <span v-else>Create</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import { ref, computed } from "vue";

const appStore = useAppStore();

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

const description = ref("");
const areaCloudCoverage = ref<number | null>(null);
const offNadirAngle = ref<number | null>(null);
const aoiCoveragePercent = ref<number | null>(null);;
const selectedPlatforms = ref(appStore.platformList);
const storeName = ref("");
const storeAddress = ref("");
const marketSegment = ref("");
const loading = ref(false);

const formattedBbox = computed(() => {
  return (
    appStore.bbox?.map((coord) => Number(coord).toFixed(10)).join(", ") || ""
  );
});

const validateCloudCoverage = (value: number) =>
  (value >= 0 && value <= 100) || "Value must be between 0 and 100";
const validateOffNadirAngle = (value: number) =>
  (value >= 0 && value <= 90) || "Value must be between 0 and 90";
const validateAoiCoveragePercent = (value: number) =>
  (value >= 1 && value <= 100 || !value) || "Value must be between 1 and 100 ";

const restrictInput = (event: KeyboardEvent) => {
  if (!/[0-9.]/.test(event.key)) {
    event.preventDefault();
  }
};

const isValidForm = computed(() => {
  if (!areaCloudCoverage.value || !offNadirAngle.value) return false;
  return (
    validateCloudCoverage(areaCloudCoverage.value) === true &&
    validateOffNadirAngle(offNadirAngle.value) === true
  );
});

const resetValues = () => {
  description.value = "";
  areaCloudCoverage.value = null;
  offNadirAngle.value = null;
  selectedPlatforms.value = appStore.platformList;
  storeName.value = "";
  storeAddress.value = "";
  marketSegment.value = "";
  aoiCoveragePercent.value = null;
}

const closeDialog = () => {
  appStore.setBbox([]);
  appStore.closeCreateMonitorModal();
  resetValues();
};

const createMonitor = async () => {
  if (!storeName.value) {
    appStore.setBanner("error", "Store Name is required.");
    return;
  }
  if(!areaCloudCoverage.value || !offNadirAngle.value){
    appStore.setBanner("error", "Match Criteria is required.")
    return;
  }

  const coordinates = [
    [
      [appStore.bbox[0], appStore.bbox[1]],
      [appStore.bbox[2], appStore.bbox[1]],
      [appStore.bbox[2], appStore.bbox[3]],
      [appStore.bbox[0], appStore.bbox[1]],
    ],
  ];

  const requestBody: CreateMonitorInterface = {
    source: "discovery/catalog",
    description: description.value,
    aoi_geojson: {
      type: "Polygon",
      coordinates,
    },
    match_criteria: {
      platform: {
        in: selectedPlatforms.value,
      },
      "eo:cloud_cover": {
        lte: areaCloudCoverage.value,
      },
      "view:off_nadir": {
        lte: offNadirAngle.value,
      },
    },
    metadata: {
      store_name: storeName.value,
      address: storeAddress.value,
      market_segment: marketSegment.value,
      creator_key: sessionStorage.getItem('apiKeyHash')
    }
  };
  if(aoiCoveragePercent.value){
    requestBody.match_criteria["aoi:coverage_pct"] = {"gte": aoiCoveragePercent.value};
  }
  loading.value = true;

  try {
    const response = await fetch(
      `https://api.maxar.com/monitoring/v1/monitors?maxar_api_key=${sessionStorage.getItem('apiKey')}`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    if (response.ok) {
      const data = await response.json();
      appStore.setBanner("success", "Monitor created successfully!");
      appStore.setBbox([]);
      closeDialog();
    } else {
      const errorData = await response.json();
      appStore.setBanner("error", errorData.message || "Failed to create monitor.");
    }
    loading.value = false;
  } catch (error) {
    appStore.setBanner("error", "Network error. Please try again.");
    loading.value = false;
  }
};
</script>

<style>
.card-container {
  padding: 10px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px !important;
}

.card-content {
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  padding-top: 0px !important;
}

.options {
  display: flex !important;
  align-items: center;
  gap: 8px !important;
  flex-wrap: wrap;
}

.checkbox-spacing {
  height: 20px;
}

.action-buttons {
  margin: 10px;
}

.match-criteria-input {
  flex: 1 1 0;
  min-width: 170px;
  max-width: calc(33.33% - 8px);
  margin: 0;
}

.match-criteria-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

</style>
