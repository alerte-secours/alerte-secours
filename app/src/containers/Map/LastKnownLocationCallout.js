import React from "react";
import { View, Text, StyleSheet } from "react-native";
import getTimeDisplay from "~/utils/time/getTimeDisplay";

const LastKnownLocationCallout = ({ timestamp }) => {
  const formattedTime = getTimeDisplay(timestamp);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dernière position connue</Text>
      <Text style={styles.timestamp}>{formattedTime}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 6,
    padding: 8,
    width: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
    top: -10, // this doesn't seem to affect the position, should be fixed by finding the good prop to achieve the goal
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 14,
  },
  timestamp: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
  },
});

export default LastKnownLocationCallout;
