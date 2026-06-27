import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.obbank.app",
  appName: "OB Bank",
  webDir: "public",
  server: {
    url: "https://ob-bank.vercel.app",
    cleartext: false
  }
};

export default config;
