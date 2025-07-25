import type { Monitor } from "@/types/FetchMonitorInterface";
import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    demoMode: false,
    drawingMode: false,
    bbox: [],
    platformList: ["geoeye-01", "worldview-01", "worldview-02", "worldview-03", "worldview-legion-01", "worldview-legion-02", "worldview-legion-03", "worldview-legion-04"],
      //"worldview-legion-05", "worldview-legion-06"
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
      if (this.demoMode && monitorId.startsWith('demo:')) {
        return this.fetchDemoMonitorEvents(monitorId);
      }

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

    async fetchDemoMonitorEvents(monitorId: string){
      try{
        const demoData = await import("@/demoData.json");
        const demoEvents = (demoData.events as any)[monitorId] || [];

        const monitor = this.monitorMap.get(monitorId);
        const storeName = monitor?.metadata.store_name || "";
        const marketSegment = monitor?.metadata.market_segment || "";
        const address = monitor?.metadata.address || "";

        const events = demoEvents.map((event: any) => ({
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
        console.error("Error fetching demo events:", error);
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
            // Check if this is a demo event
            if (this.demoMode && event.metadata.event.event_id.startsWith('demo-image:')) {
              this.fetchDemoEventInfo(event.metadata.event.event_id, event.id);
            } else {
              this.fetchEventInfo(event.metadata.event.event_id);
            }
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


    async fetchDemoEventInfo(demoEventId: string, eventId: string){
      try {
        // Create mock event source data for demo events
        const mockEventSource = {
          features: [{
            id: demoEventId,
            properties: {
              datetime: new Date().toISOString(),
              platform: "worldview-03",
              cloud_cover: Math.floor(Math.random() * 20),
            },
            bbox: [
              -105.1 + Math.random() * 0.2,
              39.7 + Math.random() * 0.2,
              -104.9 + Math.random() * 0.2,
              39.9 + Math.random() * 0.2
            ]
          }]
        };

        this.eventSourcesMap.set(demoEventId, mockEventSource);
        this.eventSourcesMap = new Map(this.eventSourcesMap);


        try {
          // Use the demo satellite SVG image
          const demoImageUrl = new URL('@/assets/demo-satellite.svg', import.meta.url).href;
          this.eventImagesMap.set(demoEventId, demoImageUrl);
          this.eventImagesMap = new Map(this.eventImagesMap);
        } catch (svgError) {
          // Fallback to canvas generation if SVG fails
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const gradient = ctx.createLinearGradient(0, 0, 512, 512);
            const colors = ['#4a5d23', '#6b7c32', '#8b9a41', '#a8b850'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            gradient.addColorStop(0, randomColor);
            gradient.addColorStop(1, '#2d3a1a');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);

            ctx.fillStyle = 'rgba(139, 154, 65, 0.6)';
            for (let i = 0; i < 5; i++) {
              const x = Math.random() * 400;
              const y = Math.random() * 400;
              const size = 20 + Math.random() * 80;
              ctx.fillRect(x, y, size, size);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '16px Arial';
            ctx.fillText('DEMO IMAGE', 10, 30);
          }

          canvas.toBlob((blob) => {
            if (blob) {
              const imageUrl = URL.createObjectURL(blob);
              this.eventImagesMap.set(demoEventId, imageUrl);
              this.eventImagesMap = new Map(this.eventImagesMap); 
            }
          });
        }

      } catch (error) {
        console.error("Error creating demo event info:", error);
        this.eventSourcesMap.set(eventId, {});
        this.eventImagesMap.set(eventId, 'noImage');
        this.eventSourcesMap = new Map(this.eventSourcesMap);
        this.eventImagesMap = new Map(this.eventImagesMap);
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
