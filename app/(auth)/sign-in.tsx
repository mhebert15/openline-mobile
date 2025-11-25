import React, { useState } from "react";
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

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
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
      setLinkSent(true);
    } else {
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

        {!linkSent ? (
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
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Send Magic Link
                </Text>
              )}
            </TouchableOpacity>

            <Text className="text-sm text-gray-500 mt-4 text-center">
              We'll send you a secure link to sign in without a password
            </Text>
          </>
        ) : (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <Text className="text-xl font-semibold text-blue-900 mb-2">
              Check your email
            </Text>
            <Text className="text-blue-700 mb-4">
              We've sent a magic link to {email}
            </Text>
            <Text className="text-sm mb-4" style={{ color: "#0086c9" }}>
              Click the link in your email to sign in. For demo purposes, you'll
              be automatically signed in shortly.
            </Text>
            <ActivityIndicator size="large" color="#0086c9" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
