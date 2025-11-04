import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mockOffices, mockAdminUsers } from '@/lib/mock/data';
import type { MedicalOffice } from '@/lib/types/database.types';
import {
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  UtensilsIcon,
  MessageSquareIcon,
  ChevronRightIcon,
  ClockIcon,
} from 'lucide-react-native';

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [location, setLocation] = useState<MedicalOffice | null>(
    mockOffices.find((office) => office.id === id) || null
  );

  if (!location) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600">Location not found</Text>
      </View>
    );
  }

  const adminUser = mockAdminUsers.find(
    (admin) => admin.id === location.admin_user_id
  );

  const handleSendMessage = () => {
    if (!adminUser) {
      Alert.alert('Error', 'Admin contact not available');
      return;
    }
    router.push({
      pathname: '/compose-message',
      params: {
        officeId: location.id,
        officeName: location.name,
        recipientId: adminUser.id,
        recipientName: adminUser.full_name,
      },
    });
  };

  const handleBookMeeting = () => {
    router.push('/(tabs)/calendar');
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Location Info Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900 mb-2">
            {location.name}
          </Text>
          <View className="flex-row items-center mb-2">
            <MapPinIcon size={16} color="#6b7280" />
            <Text className="text-gray-600 ml-2">
              {location.address}, {location.city}, {location.state}{' '}
              {location.zip_code}
            </Text>
          </View>
          <View className="flex-row items-center">
            <PhoneIcon size={16} color="#6b7280" />
            <Text className="text-gray-600 ml-2">{location.phone}</Text>
          </View>
        </View>

        <View className="px-4 py-4">
          {/* Practitioners Section */}
          {location.practitioners && location.practitioners.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <UserIcon size={20} color="#2563eb" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Medical Practitioners
                </Text>
              </View>
              {location.practitioners.map((practitioner, index) => (
                <View
                  key={practitioner.id}
                  className={`py-3 ${
                    index < location.practitioners!.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <Text className="text-gray-900 font-medium">
                    {practitioner.name}, {practitioner.title}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {practitioner.specialty}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Preferred Meeting Times */}
          {location.preferred_meeting_times && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <ClockIcon size={20} color="#2563eb" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Preferred Meeting Times
                </Text>
              </View>
              {daysOfWeek.map((day) => {
                const times =
                  location.preferred_meeting_times?.[
                    day.key as keyof typeof location.preferred_meeting_times
                  ];
                if (!times || times.length === 0) return null;
                return (
                  <View key={day.key} className="py-2">
                    <Text className="text-gray-900 font-medium">
                      {day.label}
                    </Text>
                    {times.map((time, idx) => (
                      <Text key={idx} className="text-gray-600 text-sm ml-2 mt-1">
                        • {time}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {/* Food Preferences */}
          {location.food_preferences && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <UtensilsIcon size={20} color="#2563eb" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Food Preferences
                </Text>
              </View>

              {location.food_preferences.dietary_restrictions.length > 0 && (
                <View className="mb-3">
                  <Text className="text-gray-900 font-medium mb-1">
                    Dietary Restrictions
                  </Text>
                  {location.food_preferences.dietary_restrictions.map(
                    (restriction, idx) => (
                      <Text key={idx} className="text-gray-600 text-sm ml-2">
                        • {restriction}
                      </Text>
                    )
                  )}
                </View>
              )}

              {location.food_preferences.favorite_foods.length > 0 && (
                <View className="mb-3">
                  <Text className="text-gray-900 font-medium mb-1">
                    Favorite Foods
                  </Text>
                  <View className="flex-row flex-wrap">
                    {location.food_preferences.favorite_foods.map(
                      (food, idx) => (
                        <View
                          key={idx}
                          className="bg-green-100 rounded-full px-3 py-1 mr-2 mb-2"
                        >
                          <Text className="text-green-800 text-sm">{food}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

              {location.food_preferences.dislikes.length > 0 && (
                <View>
                  <Text className="text-gray-900 font-medium mb-1">
                    Dislikes
                  </Text>
                  <View className="flex-row flex-wrap">
                    {location.food_preferences.dislikes.map((dislike, idx) => (
                      <View
                        key={idx}
                        className="bg-red-100 rounded-full px-3 py-1 mr-2 mb-2"
                      >
                        <Text className="text-red-800 text-sm">{dislike}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Office Admin Contact */}
          {adminUser && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Office Administrator
              </Text>
              <Text className="text-gray-900">{adminUser.full_name}</Text>
              <Text className="text-gray-600 text-sm">{adminUser.email}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <TouchableOpacity
          className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center mb-3"
          onPress={handleBookMeeting}
        >
          <CalendarIcon size={20} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">
            Book Meeting
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white border-2 border-blue-600 rounded-xl p-4 flex-row items-center justify-center"
          onPress={handleSendMessage}
        >
          <MessageSquareIcon size={20} color="#2563eb" />
          <Text className="text-blue-600 font-semibold text-lg ml-2">
            Send Message
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
