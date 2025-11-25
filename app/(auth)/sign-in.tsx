import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "expo-router";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { signIn, verifyOtp, user } = useAuth();
  const router = useRouter();

  // Navigate to main app when user is authenticated
  useEffect(() => {
    if (user) {
      console.log("User authenticated, navigating to tabs");
      router.replace("/(tabs)/(dashboard)");
    }
  }, [user, router]);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    const result = await signIn(email);
    setLoading(false);

    if (result.success) {
      setOtpSent(true);
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP code");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Error", "OTP code must be 6 digits");
      return;
    }

    setLoading(true);
    const result = await verifyOtp(email, otp);
    setLoading(false);

    if (!result.success) {
      Alert.alert("Error", result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-12">
          <Text className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to
          </Text>
          <Text
            className="text-4xl font-bold mb-4"
            style={{ color: "#0086c9" }}
          >
            Openline
          </Text>
          <Text className="text-lg text-gray-600">
            Book meetings and connect with medical offices
          </Text>
        </View>

        {!otpSent ? (
          <>
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email Address
              </Text>
              <TextInput
                className="border border-gray-200 rounded-md px-4 py-4 flex-row items-center"
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              className="rounded-lg py-4"
              style={{ backgroundColor: loading ? "#0086c9" : "#0086c9" }}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Send OTP Code
                </Text>
              )}
            </TouchableOpacity>

            <Text className="text-sm text-gray-500 mt-4 text-center">
              We'll send you a 6-digit code to sign in
            </Text>
          </>
        ) : (
          <>
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <Text className="text-xl font-semibold text-blue-900 mb-2">
                Check your email
              </Text>
              <Text className="text-blue-700 mb-2">
                We've sent a 6-digit code to {email}
              </Text>
              <Text className="text-sm text-gray-600">
                For local development, view the email at:{"\n"}
                http://127.0.0.1:54324
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Enter OTP Code
              </Text>
              <TextInput
                className="border border-gray-200 rounded-md px-4 py-4 flex-row items-center text-center text-2xl tracking-widest"
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                autoFocus
              />
            </View>

            <TouchableOpacity
              className="rounded-lg py-4 mb-3"
              style={{ backgroundColor: loading ? "#0086c9" : "#0086c9" }}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Verify Code
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setOtpSent(false);
                setOtp("");
              }}
              disabled={loading}
            >
              <Text className="text-center text-gray-600">
                Use a different email
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
