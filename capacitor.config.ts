import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.netshop.paymentshub',
  appName: 'Netshop Payments Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    useLegacyBridge: false
  }
};

export default config;
