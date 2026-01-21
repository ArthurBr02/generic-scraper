import { defineStore } from 'pinia';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    systemTheme: 'light' | 'dark';
}

export const useThemeStore = defineStore('theme', {
    state: (): ThemeState => ({
        theme: (localStorage.getItem('theme') as Theme) || 'system',
        systemTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    }),

    getters: {
        currentTheme(state): 'light' | 'dark' {
            return state.theme === 'system' ? state.systemTheme : state.theme;
        },

        isDark(state): boolean {
            return this.currentTheme === 'dark';
        },
    },

    actions: {
        setTheme(theme: Theme) {
            this.theme = theme;
            localStorage.setItem('theme', theme);
            this.applyTheme();
        },

        applyTheme() {
            const htmlElement = document.documentElement;

            if (this.currentTheme === 'dark') {
                htmlElement.classList.add('dark');
            } else {
                htmlElement.classList.remove('dark');
            }
        },

        toggleTheme() {
            if (this.theme === 'light') {
                this.setTheme('dark');
            } else if (this.theme === 'dark') {
                this.setTheme('system');
            } else {
                this.setTheme('light');
            }
        },

        initTheme() {
            // Listen for system theme changes
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            mediaQuery.addEventListener('change', (e) => {
                this.systemTheme = e.matches ? 'dark' : 'light';
                if (this.theme === 'system') {
                    this.applyTheme();
                }
            });

            // Apply initial theme
            this.applyTheme();
        },
    },
});
