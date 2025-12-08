import Constants from "expo-constants";

/**
 * Check if the app is running in a development build (not Expo Go)
 * Development builds support push notifications and other native features
 * that are not available in Expo Go.
 */
export function isDevelopmentBuild(): boolean {
  // In Expo Go, executionEnvironment is 'storeClient' (string)
  // In development builds, executionEnvironment is 'standalone' or 'bare'
  // In development (dev client), executionEnvironment is 'standalone'
  const executionEnvironment = Constants.executionEnvironment;
  
  // Check if running in Expo Go
  // executionEnvironment can be: 'storeClient' (Expo Go), 'standalone' (dev build), 'bare' (bare workflow)
  if (executionEnvironment === "storeClient") {
    return false; // Expo Go
  }
  
  // Development builds and standalone apps
  return true;
}

/**
 * Check if running in Expo Go
 */
export function isExpoGo(): boolean {
  return !isDevelopmentBuild();
}

