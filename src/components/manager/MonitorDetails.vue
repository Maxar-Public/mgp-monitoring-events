<template>
    <v-dialog v-model="appStore.seeMonitorDetails" max-width="500px">
      <v-card v-if="monitor">
        <v-card-title>Monitor Details</v-card-title>
        <v-divider class="mx-3"></v-divider>
        <v-card-text>
          <h4>Market Information:</h4>
          <div class="ml-3">
            <li><strong>Store Name:</strong> {{ monitor.metadata?.store_name }}</li>
            <li><strong>Address:</strong> {{ monitor.metadata?.address }}</li>
            <li><strong>Market Segment:</strong> {{ monitor.metadata?.market_segment }}</li>
          </div>
          <v-expansion-panels class="mt-6">
            <v-expansion-panel title="More Details">
              <v-expansion-panel-text>
                <p><strong>Monitor ID:</strong> {{ monitor.id }}</p>
                <p><strong>Created Date:</strong> {{ formatDate(monitor.date_created) }}</p>
                <p><strong>Modified Date:</strong> {{ formatDate(monitor.date_modified) }}</p>
                <p><strong>Source:</strong> {{ monitor.source }}</p>
                <p><strong>Description:</strong> {{ monitor.description }}</p>
                <p><strong>Start Date:</strong> {{ formatDate(monitor.start_datetime) || "N/A" }}</p>
                <p><strong>End Date:</strong> {{ formatDate(monitor.end_datetime) || "N/A" }}</p>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="AOI Coordinates">
              <v-expansion-panel-text v-if="monitor.aoi_geojson?.coordinates">
                <ul v-if="monitor.aoi_geojson?.coordinates" class="ml-4">
                  <li v-for="(coord, index) in monitor.aoi_geojson.coordinates[0]" :key="index">
                    {{ coord[1] }}, {{ coord[0] }}
                  </li>
                </ul>
              </v-expansion-panel-text>
              <v-expansion-panel-text v-else>No coordinates available</v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Match Criteria">
              <v-expansion-panel-text v-if="monitor.match_criteria">
                <p v-if="monitor.match_criteria?.['eo:cloud_cover']">
                  <strong>Cloud Cover: </strong>
                  <span v-for="(val,key) in monitor.match_criteria['eo:cloud_cover']" :key="key">
                    {{ operatorSymbols[key] }} {{ val }}
                  </span>
                </p>
                <p v-if="monitor.match_criteria?.['view:off_nadir']">
                  <strong>Off-Nadir Angle: </strong>
                  <span v-for="(val,key) in monitor.match_criteria['view:off_nadir']" :key="key">
                    {{ operatorSymbols[key] }} {{ val }}
                  </span>
                </p>
                <p v-if="monitor.match_criteria?.['aoi:coverage_pct']">
                  <strong>AOI Coverage Pertentage: </strong>
                  <span v-for="(val,key) in monitor.match_criteria['aoi:coverage_pct']" :key="key">
                    {{ operatorSymbols[key] }} {{ val }}
                  </span>
                </p>
                <p v-if="monitor.match_criteria.platform">
                  <strong>Platforms:</strong> {{ monitor.match_criteria.platform.in.join(", ") }}
                </p>
              </v-expansion-panel-text>
              <v-expansion-panel-text v-else>No match criteria available.</v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Monitor Links">
              <v-expansion-panel-text>
                <p style="word-break: break-all; white-space: normal;"><strong>Self:</strong> {{ monitor.monitor_links.self }}</p>
                <p style="word-break: break-all; white-space: normal;"><strong>Events:</strong> {{ monitor.monitor_links.events }}</p>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="appStore.setMonitorDetails(false)">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { useAppStore } from "@/stores/app";
import type { Monitor } from "@/types/FetchMonitorInterface";
  
  // Define expected props
  const props = defineProps<{
    monitor: Monitor | null;
  }>();

const operatorSymbols = {
  lt: "<",
  gt: ">",
  lte:"<=",
  gte: ">=",
  eq: "="
}

  const appStore = useAppStore();
  
  const formatDate = (date: string | null) => {
  return date ? new Date(date).toLocaleString() : null;
};
  </script>
  