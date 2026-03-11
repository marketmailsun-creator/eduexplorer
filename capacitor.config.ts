import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.eduexplorer.app',
  appName: 'EduExplorer',
  webDir: 'out', // not used in remote URL mode but required by Capacitor
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.eduexplorer.ai',
    cleartext: false, // only allow HTTPS
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      permissions: ['camera', 'photos'],
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
