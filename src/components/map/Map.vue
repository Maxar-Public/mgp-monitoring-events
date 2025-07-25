<template>
  <div id="map-container">
    <div id="map">
      <v-tooltip 
        v-text="mouseTooltip" 
        v-if="showTooltip" 
        :style="{ top: `${mousePosition.y - 10}px`, left: `${mousePosition.x + 315}px`, borderRadius: '4px' }">
      </v-tooltip>
    </div>
    <v-btn size="small" variant="elevated" @click="drawBbox" class="create-button"
      :disabled="appStore.drawingMode || appStore.demoMode"
      >Create New Monitor</v-btn
      >
    <div class="custom-zoom-controls">
      <button class="zoom-button" @click="zoomIn">
        <v-icon>mdi-plus</v-icon>
      </button>
      <button class="zoom-button" @click="zoomOut">
        <v-icon>mdi-minus</v-icon>
      </button>
    </div>
    <CreateMonitor />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, watch, ref } from "vue";
import { useAppStore } from "@/stores/app";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuthStore } from "@/stores/auth";

const appStore = useAppStore();
let map: L.Map | null = null;
let drawnItems: L.FeatureGroup;
let rectangle: L.Rectangle | null = null;
let startLatLng: L.LatLng | null = null;
let southWest: L.LatLng, northEast: L.LatLng;

const mouseTooltip = ref("Click and drag to draw rectangle.");
const mousePosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);
const isMouseInside = ref(false);
const authStore = useAuthStore()


// Function to start drawing mode
const drawBbox = () => {
  if (!map) return;
  appStore.clearBanner();
  appStore.startDrawing();
  map.dragging.disable();
  map.scrollWheelZoom.disable();
  map.doubleClickZoom.disable();
  map.getContainer().style.cursor = "crosshair";
  map.on("mousedown", onMouseDown);
  
  // If the mouse is already inside the map, activate the tooltip
  if (isMouseInside.value) {
    showTooltip.value = true;
    mouseTooltip.value = "Click and drag to draw rectangle.";
  }
};

// Events for the drawing process
const onMouseDown = (e: L.LeafletMouseEvent) => {
  if (!map) return;
  startLatLng = e.latlng;
  mouseTooltip.value = "Release mouse to finish drawing."; // Update the tooltip text
  map.on("mousemove", onMouseMove);
  map.on("mouseup", onMouseUp);
};

const onMouseMove = (e: L.LeafletMouseEvent) => {
  if (!map || !startLatLng) return;
  const bounds = L.latLngBounds(startLatLng, e.latlng);

  if (rectangle) {
    rectangle.setBounds(bounds);
  } else {
    rectangle = L.rectangle(bounds, {
      color: "#ff7800",
      weight: 1,
      fillOpacity: 0.1,
    }).addTo(map);
  }
};

const onMouseUp = () => {
  if (!map) return;
  map.off("mousemove", onMouseMove);
  map.off("mouseup", onMouseUp);
  stopDrawingBBOX();

  if (rectangle) {
    drawnItems.addLayer(rectangle);
    const bounds = rectangle.getBounds();
    southWest = bounds.getSouthWest();
    northEast = bounds.getNorthEast();

    const bboxPoints: any = [
      southWest.lng,
      southWest.lat,
      northEast.lng,
      northEast.lat,
    ];
    appStore.setBbox(bboxPoints);
  }

  // Deactivate the tooltip when drawing is finished
  showTooltip.value = false;
};

// Function to stop drawing mode
const stopDrawingBBOX = () => {
  if (!map) return;
  map.dragging.enable();
  map.scrollWheelZoom.enable();
  map.doubleClickZoom.enable();
  map.getContainer().style.cursor = "";
  map.off("mousedown", onMouseDown);
  showTooltip.value = false;
  appStore.stopDrawing();
  appStore.openCreateMonitorModal();
};

// Zoom functions
const zoomIn = () => {
  if (map) map.zoomIn();
};

const zoomOut = () => {
  if (map) map.zoomOut();
};

// Update the mouse position relative to the map container
const updateMousePosition = (event: MouseEvent) => {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;
  
  const rect = mapContainer.getBoundingClientRect();
  mousePosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

// Events to detect when the mouse enters and leaves the map container
const onMouseEnter = () => {
  isMouseInside.value = true;
  // If we are in drawing mode, activate the tooltip
  if (appStore.drawingMode) {
    showTooltip.value = true;
  }
};

const onMouseLeave = () => {
  isMouseInside.value = false;
  showTooltip.value = false;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && appStore.drawingMode) {
    stopDrawingBBOX();
    appStore.closeCreateMonitorModal();
  }
};

onMounted(() => {
  if (!authStore.isTokenValid()) {
    authStore.showLoginModal = true;
  } else {
  }
  
  const mapContainer = document.getElementById("map");
  if (mapContainer) {
    mapContainer.addEventListener("mousemove", updateMousePosition);
    mapContainer.addEventListener("mouseenter", onMouseEnter);
    mapContainer.addEventListener("mouseleave", onMouseLeave);
  }

  document.addEventListener("keydown", onKeydown);

  // Initialize the Leaflet map
  map = L.map("map", {
    zoomControl: false,
    maxBounds: [
      [-90, -180],
      [90, 180],
    ],
    minZoom: 2,
  }).setView([39.87, -105.045], 8);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  if(appStore.drawingMode){
    drawBbox();
  }
});

onUnmounted(() => {
  const mapContainer = document.getElementById("map");
  if (mapContainer) {
    mapContainer.removeEventListener("mousemove", updateMousePosition);
    mapContainer.removeEventListener("mouseenter", onMouseEnter);
    mapContainer.removeEventListener("mouseleave", onMouseLeave);
  }

  document.removeEventListener("keydown", onKeydown);

  if(appStore.drawingMode){
    appStore.stopDrawing();
  }
});

watch(
  () => appStore.drawingMode,
  (isDrawing) => {
    if (isDrawing) {
      drawBbox();
    }
  }
);

watch(
  () => appStore.bbox,
  (newBbox) => {
    if (map && newBbox.length === 0 && rectangle) {
      map.removeLayer(rectangle);
      rectangle = null;
    }
  }
);

</script>

<style scoped>
@import "leaflet/dist/leaflet.css";

#map-container {
  position: relative;
  height: 100vh;
  width: 100%;
}

#map {
  height: 100vh;
  width: 100%;
}

.leaflet-control-zoom-in, .leaflet-control-zoom-out {
  width: 32px; 
  height: 32px; 
  border-radius: 32px; 
  line-height: 32px; 
  text-align: center; 
}

.leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
  background-color: #e6e6e6; 
}

.leaflet-touch .leaflet-control-layers, .leaflet-touch .leaflet-bar {
  border: none;
}

.leaflet-control-zoom-in {
  margin-bottom: 8px; 
}
.custom-zoom-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.zoom-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s;
}

.zoom-button:hover {
  background-color: #f0f0f0;
}

.v-icon {
  font-size: 20px;
}

.v-tooltip {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  background-color: #616161E5;
  color: white;
  font-size: xx-small;
  padding: 5px 10px;
  width: max-content;
  height: max-content;
}
.create-button {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  z-index: 1000;
}
</style>
