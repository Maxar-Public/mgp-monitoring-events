import { createRouter, createWebHistory } from 'vue-router';
import Map from '@/components/map/Map.vue';
import Manager from '@/components/manager/monitor.vue';
import EventsTable from '@/components/events/EventsTable.vue';

const routes = [
  { path: '/', component: Map,meta: { requiresAuth: false } },
  { path: '/manager', component: Manager, meta: { requiresAuth: false } },
  { path: '/events', component: EventsTable, meta: { requiresAuth: false }}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


export default router;




