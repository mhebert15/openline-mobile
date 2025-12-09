import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from "react-native";
import type { MedicalOffice } from "@/lib/types/database.types";
import { MapPinIcon, PhoneIcon, ChevronRightIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

function LocationsScreen() {
  const { cache, prefetchTabData, isLoading } = useDataCache();
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const placeholderImage = require("../../../assets/images/placeholder_location.png");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Get data from cache
  const locations = (cache.locations.offices.data as MedicalOffice[]) || [];

  // Only show loader if cache is empty AND currently loading
  const loading = isLoading("locations") && locations.length === 0;

  // Background refresh if cache is empty
  useEffect(() => {
    if (!cache.locations.offices.data) {
      prefetchTabData("locations").catch((error) => {
        console.error("Error loading locations:", error);
      });
    }
  }, [cache.locations.offices.data, prefetchTabData]);

  const handleLocationPress = (locationId: string) => {
    router.push({
      pathname: "/(tabs)/locations/location-detail",
      params: { id: locationId },
    });
  };

  const handleCallPress = async (rawPhone: string) => {
    const sanitized = rawPhone.replace(/[^0-9+]/g, "");
    if (!sanitized) {
      Alert.alert("Unavailable", "No phone number available for this office.");
      return;
    }

    const telUrl = `tel:${sanitized}`;

    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert(
          "Unable to call",
          "Your device cannot make phone calls at this time."
        );
      }
    } catch (error) {
      console.error("Error opening dialer:", error);
      Alert.alert("Error", "Something went wrong trying to start the call.");
    }
  };

  const handleImageError = (locationId: string) => {
    setFailedImages((prev) => ({
      ...prev,
      [locationId]: true,
    }));
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 16, // Tab bar height + extra padding
        }}
      >
        <View className="p-4">
          {locations.map((location) => {
            const hasImage = Boolean(
              location.image_url && location.image_url.trim().length > 0
            );
            const shouldShowPlaceholder =
              !hasImage || failedImages[location.id];
            const imageSource = shouldShowPlaceholder
              ? placeholderImage
              : { uri: location.image_url as string };

            return (
              <View
                key={location.id}
                className="bg-white border border-gray-300 mb-3 shadow-sm rounded-xl overflow-hidden"
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleLocationPress(location.id)}
                >
                  <Image
                    source={imageSource}
                    className="w-full h-40"
                    resizeMode="cover"
                    onError={() => handleImageError(location.id)}
                  />
                  <View className="flex-row items-start p-4">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900 mb-2">
                        {location.name}
                      </Text>
                      <View className="flex-row items-center mb-1">
                        <MapPinIcon size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">
                          {location.address}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <MapPinIcon size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">
                          {location.city}, {location.state} {location.zip_code}
                        </Text>
                      </View>
                    </View>
                    <ChevronRightIcon size={24} color="#9ca3af" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center justify-center bg-[#0086c9] px-4 py-3"
                  activeOpacity={0.85}
                  onPress={() => handleCallPress(location.phone)}
                >
                  <PhoneIcon size={20} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Call Office
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default function LocationsScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <LocationsScreen />
    </AnimatedTabScreen>
  );
}
