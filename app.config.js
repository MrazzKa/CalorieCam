export default {
  expo: {
    name: "CalorieCam",
    slug: "caloriecam",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png", // Using PNG for native splash - custom SVG logo shown in app
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    scheme: "caloriecam",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.caloriecam.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      associatedDomains: [
        "applinks:caloriecam.app",
        "applinks:*.caloriecam.app"
      ]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.caloriecam.app",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "caloriecam.app",
              pathPrefix: "/v1/auth/magic/consume"
            },
            {
              scheme: "caloriecam"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
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
