import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.donkeysisle.pleasedontbreakme',
  appName: 'Please Dont Break Me',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
