import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import type { MedicalOffice } from "@/lib/types/database.types";
import { MapPinIcon, PhoneIcon, ChevronRightIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";

function LocationsScreen() {
  const { cache, prefetchTabData, isLoading } = useDataCache();
  const router = useRouter();

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Medical Offices
          </Text>
          {locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm"
              activeOpacity={0.7}
              onPress={() => handleLocationPress(location.id)}
            >
              <View className="flex-row items-start">
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
                  <View className="flex-row items-center mb-1">
                    <MapPinIcon size={16} color="#6b7280" />
                    <Text className="text-gray-600 ml-2">
                      {location.city}, {location.state} {location.zip_code}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <PhoneIcon size={16} color="#6b7280" />
                    <Text className="text-gray-600 ml-2">{location.phone}</Text>
                  </View>
                </View>
                <ChevronRightIcon size={24} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))}
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
