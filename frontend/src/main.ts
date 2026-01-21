import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';
import { useThemeStore } from './stores/theme';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Initialize theme
const themeStore = useThemeStore();
themeStore.initTheme();

app.mount('#app');
