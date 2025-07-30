import { defineStore } from 'pinia'
import CryptoJS from 'crypto-js'; 

interface AuthState {
  apiKey: string | null;
  apiKeyHash: string | null;
  showLoginModal: boolean;  
}

export const useAuthStore = defineStore('auth', {

  state: (): AuthState => ({
    apiKey: sessionStorage.getItem('apiKey') || localStorage.getItem('apiKey'),
    apiKeyHash: sessionStorage.getItem('apiKeyHash') || localStorage.getItem('apiKeyHash'),
    showLoginModal: false, 
  }),

  actions: {

    async checkApiKey(apiKey: string){
      //API Endpoint workaround for checking if the API Key is valid
      const response = await fetch(`https://api.maxar.com/streaming/v1/ogc/ows?service=WFS&request=DescribeFeatureType&version=2.0.0&maxar_api_key=${apiKey}`, {
        method: 'HEAD'
      });

      if (!response.ok) {
        throw new Error('API Key validation failed')
      }
      else{
        this.saveApiKey(apiKey);
      }
  },

    saveApiKey(key: string){
      this.apiKey = key;
      sessionStorage.setItem('apiKey', this.apiKey)
      localStorage.setItem('apiKey', this.apiKey) 
      this.hashApiKey(key);
    },

    hashApiKey(key: string){
      this.apiKeyHash = CryptoJS.SHA256(key).toString(CryptoJS.enc.Hex);
      sessionStorage.setItem('apiKeyHash', this.apiKeyHash)
      localStorage.setItem('apiKeyHash', this.apiKeyHash) 
    },

    logout() {
      sessionStorage.removeItem('apiKey')
      sessionStorage.removeItem('apiKeyHash')
      localStorage.removeItem('apiKey')
      localStorage.removeItem('apiKeyHash')
      this.showLoginModal = true; 
    },

    isTokenValid(): boolean {
      if (sessionStorage.getItem('apiKey')) return true;
      else return false;
    },

    checkAuth() {
      if (!sessionStorage.getItem('apiKey')) {
        this.showLoginModal = true;
      }
    },

  }
})
