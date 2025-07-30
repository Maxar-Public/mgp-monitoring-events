<template>
    <v-dialog
      v-model="visible"
      fullscreen
      hide-overlay
      scrim="rgba(0,0,0,1)"
    >
      <v-card flat class="popup-card d-flex flex-column align-center" style="background: transparent;">
        <v-btn icon text class="close-btn" @click="visible = false">
          <v-icon color="white" size="32">mdi-close</v-icon>
        </v-btn>
        <div class="image-content">
        <img
        v-if="src"
        :src="src"
        class="full-image"
        contain
      />
      <div v-if="featureImageId" class="image-id">
        Feature ID: {{ featureImageId }}
      </div>
    </div>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
import { computed } from 'vue';

  const props = defineProps<{
    modelValue: boolean
    src: string
    featureImageId: string
  }>()
  
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
  }>()
  
  // proxy v-model
  const visible = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v),
  })
  </script>
  
  <style scoped>
.popup-card {
  position: relative;
  height: 100%;
  width: 100%;
  background: transparent;
}
.image-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 80px;
}
.full-image {
  max-width: 90vw;
  max-height: 90vh;
  display: block;
  margin: auto;
}

.image-id {
  margin-top: 12px;
  width: 100%;
  text-align: center;
  color: white;
  font-weight: 500;
}
.close-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  color: white;
  z-index: 10;
  background-color: red !important;
  box-shadow: none !important;
}
</style>