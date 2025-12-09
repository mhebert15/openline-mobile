import React from "react";
import { View, StyleSheet } from "react-native";

interface AnimatedTabScreenProps {
  children: React.ReactNode;
}

export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
