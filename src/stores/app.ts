import type { Monitor } from "@/types/FetchMonitorInterface";
import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    demoMode: false,
    drawingMode: false,
    bbox: [],
    platformList: ["geoeye-01", "worldview-01", "worldview-02", "worldview-03", "worldview-legion-01", "worldview-legion-02"] ,
    createMonitorModal: false,
    updateMonitorModal: false,
    monitorRefresh: false,
    selectedMonitorUpdate: null as any,
    seeMonitorDetails: false,
    banner: {
      message: "",
      type: undefined as "success" | "error" | "info" | "warning" | undefined,
    },
    /* creatorId: import.meta.env.VITE_CREATOR_ID, */ // Use this if you have your monitor creatorID to filter the monitor fetch.
    monitorEvents: [] as any[],
    monitors: [] as any[],
    monitorMap: new Map<any, any>(),
    hoveredEvent: null as any,
    selectedEvent: null as any,
    eventImagesMap: new Map<any, any>(),
    eventSourcesMap: new Map<any, any>(),
  }),
  actions: {
    toggleDemoMode(status: boolean){
      this.demoMode = status;
    },
    setBbox(bbox: []) {
      this.bbox = bbox;
    },
    startDrawing() {
      this.drawingMode = true;
    },
    stopDrawing() {
      this.drawingMode = false;
    },
    setPlatformsItems(platforms: string[]) {
      this.platformList = platforms;
    },
    openCreateMonitorModal() {
      this.createMonitorModal = true;
    },
    closeCreateMonitorModal() {
      this.createMonitorModal = false;
    },
    toggleUpdateMonitorModal(status: boolean) {
      this.updateMonitorModal = status;
    },
    monitorManagerRefresh(status: boolean){
      this.monitorRefresh = status;
    },
    setMonitorForUpdate(monitor: any){
      this.selectedMonitorUpdate = monitor;
    },
    setMonitorDetails(status: boolean){
      this.seeMonitorDetails = status;
    },
    setBanner(type: "success" | "error" | "info" | "warning", message: string) {
      this.banner.message = message;
      this.banner.type = type;

      if (type === "success") {
        setTimeout(() => {
          this.clearBanner();
        }, 5000);
      }
    },
    clearBanner() {
      this.banner.message = "";
      this.banner.type = undefined;
    },

    async fetchMonitors() {
      try {
        const response = await fetch(
          //`https://api.maxar.com/monitoring/v1/monitors?limit=1000&sort=asc&filter=creator_id:${this.creatorId}&maxar_api_key=${sessionStorage.getItem('apiKey')}`, // fetch monitors using creatorID
          `https://api.maxar.com/monitoring/v1/monitors?limit=1000&sort=asc&filter=metadata.creator_key:${sessionStorage.getItem('apiKeyHash')}&maxar_api_key=${sessionStorage.getItem('apiKey')}`,
          {
            method: "GET"
          }
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
    
        // Filters only monitors that contain the correct metadata
        this.monitors = data.data.monitors.filter((monitor: Monitor) => monitor.metadata.store_name);

        // Place monitors in map for their respective events
        this.monitors.forEach(monitor => this.monitorMap.set(monitor.id, monitor));
      } catch (error) {
        console.error("Error fetching monitors:", error);
      }
    },

    async fetchDemoMonitors(){
      //import demoData = "@\monitoring\demoData.json";
      try{
        const demoData = await import("@/demoData.json")
        const data = demoData;
    
        // Filters only monitors that contain the correct metadata
        this.monitors = data.data.monitors.filter(monitor => monitor.metadata.store_name);

        // Place monitors in map for their respective events
        this.monitors.forEach(monitor => this.monitorMap.set(monitor.id, monitor));
        
      } catch(error) {
        console.error("Error fetching monitors:", error);
      }

    },

    async fetchMonitorEvents(monitorId: string){
      try{
        const response = await fetch(`https://api.maxar.com/monitoring/v1/monitors/${monitorId}/events?maxar_api_key=${sessionStorage.getItem('apiKey')}`,
          {
            method: "GET"
          }
        );
        const data = await response.json();

        //Place Market info of the event's monitor for easy access using the monitorMap
        const storeName = this.monitorMap.get(monitorId).metadata.store_name ? this.monitorMap.get(monitorId).metadata.store_name : "";
        const marketSegment = this.monitorMap.get(monitorId).metadata.market_segment ? this.monitorMap.get(monitorId).metadata.market_segment : "";
        const address = this.monitorMap.get(monitorId).metadata.address ? this.monitorMap.get(monitorId).metadata.address : "";
        const events = data.data.events.map((event: any) => ({
          id: event.id,
          event_timestamp: event.event_timestamp,
          type: event.event.type ? event.event.type : "",
          store_name: storeName,
          market_segment: marketSegment,
          address: address,
          metadata: event,
        }));

        return events;
      }
      catch (error) {
        console.error("Error fetching data:", error);
        return [];
      }
    },
    async fetchAllEvents(){
      try {
        // Fetching all events from each monitor of the user
        const promises = this.monitors.map(monitor => this.fetchMonitorEvents(monitor.id));
        const results = await Promise.all(promises);
        this.monitorEvents = results.flat();

        // In case the customer only wants events that contain images, uncomment this code
        // this.monitorEvents = this.monitorEvents.filter(event => event.metadata.event.type);
        this.fetchAllEventsInfo();
      }
      catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    async fetchAllEventsInfo(){
      this.monitorEvents.forEach(event => {
        if(!this.eventImagesMap.get(event.metadata.event.event_id)){
          if(event.metadata.event.event_id){
            this.fetchEventInfo(event.metadata.event.event_id)
          }
          else{
            // In the case that event does not contain image information, safe event metadata in map using id.
            this.eventSourcesMap.set(event.id, event.metadata);
            this.eventImagesMap.set(event.id, 'noImage'); // Place noImage for the app to use the placeholder image from assets folder
            this.eventSourcesMap = new Map(this.eventSourcesMap); // Trigger reactivity so it's reflected in the map
            this.eventImagesMap = new Map(this.eventImagesMap); // Trigger reactivity so it's reflected in the map
          }
        }
      });
    },
    async fetchEventInfo(eventId: string){
      try {
        // fetching Event Source Info, this should be changed in the future to the correct endpoint 
        const sourceResponse = await fetch(`https://api.maxar.com/discovery/v1/search?sortby=datetime&ids=${eventId}&maxar_api_key=${sessionStorage.getItem('apiKey')}`,
          {
            method: "GET"
          }
        );
        const data = await sourceResponse.json();
        this.eventSourcesMap.set(eventId, data);
        this.eventSourcesMap = new Map(this.eventSourcesMap); // Trigger reactivity so it's reflected in the map

        // Fetch satelite image from WMS Map as a preview image in the event table.
        const bbox = data.features[0].bbox;
        const response = await fetch('https://api.maxar.com/streaming/v1/ogc/wms?service=WMS&request=GetMap&version=1.3.0&bbox='+bbox[1]+','+bbox[0]+','+bbox[3]+','+bbox[2]+'&crs=EPSG:4326&layers=Maxar:Imagery&height=512&width=512&format=image/png&cql_Filter=legacyIdentifier%3D%27'+eventId+'%27&transparent=true&maxar_api_key='+sessionStorage.getItem('apiKey'));
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob); // Convert Blob to URL
        this.eventImagesMap.set(eventId, imageUrl); // Place image data in map for displaying in table
        this.eventImagesMap = new Map(this.eventImagesMap); // Trigger reactivity so it's reflected in the map
      }
      catch (error) {
        console.error("Error fetching data:", error);
      }
    },
  
    async toggleMonitorStatus(monitorId: string, action: "enable" | "disable") {
      const url = `https://api.maxar.com/monitoring/v1/monitors/${monitorId}/${action}?maxar_api_key=${sessionStorage.getItem('apiKey')}`;
      const response = await fetch(url, {
        method: "POST"
      });
    
      return response;
    }
  },
});
