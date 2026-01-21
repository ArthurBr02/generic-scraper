import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TasksListView from '@/views/TasksListView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'tasks',
    component: TasksListView,
    meta: {
      title: 'Tâches de scraping'
    }
  },
  {
    path: '/task/new',
    name: 'task-create',
    component: () => import('@/views/TaskEditorView.vue'),
    meta: {
      title: 'Nouvelle tâche'
    }
  },
  {
    path: '/task/:id',
    name: 'task-edit',
    component: () => import('@/views/TaskEditorView.vue'),
    meta: {
      title: 'Éditer la tâche'
    }
  },
  {
    path: '/task/:id/run',
    name: 'task-run',
    component: () => import('@/views/TaskRunView.vue'),
    meta: {
      title: 'Exécution de la tâche'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'Generic Scraper'} - Generic Scraper`;
  next();
});

export default router;
