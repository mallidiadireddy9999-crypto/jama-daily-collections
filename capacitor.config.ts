import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4e20bee24425468ca3e63d0996a68eeb',
  appName: 'jama-daily-collections',
  webDir: 'dist',
  server: {
    url: 'https://4e20bee2-4425-468c-a3e6-3d0996a68eeb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;