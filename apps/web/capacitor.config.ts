import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.helpfinder.app',
  appName: 'HelpFinder',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: 'none'
    }
  }
};

export default config;
