<template>
    <v-app>
      <div class="container">
        <Panel />
        <Banner />
        <router-view />
      </div>
      <LoginModal v-if="authStore.showLoginModal" />
    </v-app>
  </template>
  
  <script setup lang="ts">
  import { useAuthStore } from '@/stores/auth';
  import { onMounted } from 'vue';
  import LoginModal from '@/components/services/Login.vue';
  
  const authStore = useAuthStore();
  
  onMounted(() => {
    authStore.checkAuth(); 
  });
  </script>
  
  <style scoped>
  .container {
      display: flex;
      flex-direction: row;
      height: 100vh; 
      overflow: hidden; 
  }
  
  .content {
      flex-grow: 1;
      height: 100vh; 
      overflow: hidden; 
  }
  </style>
  