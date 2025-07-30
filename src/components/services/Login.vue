<!-- src/components/LoginModal.vue -->
<template>
  <v-dialog v-model="showDialog" persistent max-width="722">
    <v-card class="auth-popup">
      <v-card-title>
        <span class="text-h6">Enter API Key</span>
      </v-card-title>

      <v-card-text>
        An API Key is required to use this app.
        <v-text-field
          label="API Key"
          v-model="apiKey"
          placeholder="Insert API Key"
          type= 'password'
          clearable
          class="mt-3"
          :disabled="loading"
        />
      </v-card-text>

      <v-card-actions>
        <v-btn variant="outlined"
         @click="saveApiKeyAndCheck"
         :disabled="!apiKey || loading"
         data-test="auth-button"
        >
          <v-progress-circular
            v-if="loading"
            indeterminate
            color="white"
            :size="20"
          ></v-progress-circular>
          <span v-else>CONTINUE</span>
        </v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
  
<script lang="ts" setup>
  import { ref } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { useRouter } from 'vue-router';
  import { useAppStore } from '@/stores/app';

  const authStore = useAuthStore();
  const router = useRouter();
  const appStore = useAppStore();

  const loading = ref(false);
  const showDialog = ref(true);
  const apiKey = ref("");

  const saveApiKeyAndCheck = async () => {

    try{
      loading.value = true;
      await authStore.checkApiKey(apiKey.value);
      router.push('/');
      appStore.clearBanner(); 
      showDialog.value = false;
      appStore.setBanner("success", "API Key Validated");
      appStore.monitorManagerRefresh(true);
    }
    catch (err: any) {
      appStore.setBanner("error", "Key invalid. Check you have the correct API key and try again.");
    } finally {
      loading.value = false;
    }
  };

</script>

  
<style scoped>
.auth-popup {
  border-top: 1px solid white;
}

.fill-height {
  height: 100vh;
  color: black;
}

.dialog-container {
  padding: 20px 10px;
}
</style>
  