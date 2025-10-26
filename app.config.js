export default {
  expo: {
    name: "CalorieCam",
    slug: "caloriecam",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.caloriecam.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.caloriecam.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-camera",
      "expo-image-picker",
      "expo-media-library"
    ]
  }
};
