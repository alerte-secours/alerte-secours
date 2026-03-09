import React, { useCallback, useRef } from "react";
import { View, ScrollView, InteractionManager } from "react-native";
import { createStyles } from "~/theme";
import ParamsNotifications from "./Notifications";
import ParamsRadius from "./Radius";
import ParamsEmergencyCall from "./EmergencyCall";
import ThemeSwitcher from "./ThemeSwitcher";
import Permissions from "./Permissions";
import SentryOptOut from "./SentryOptOut";
import { useRoute, useFocusEffect } from "@react-navigation/native";

export default function ParamsView({ data }) {
  const styles = useStyles();

  const scrollRef = useRef(null);
  const { params } = useRoute();
  const didScroll = useRef(false);

  const recordLayout = useCallback(
    (key) =>
      ({
        nativeEvent: {
          layout: { y },
        },
      }) => {
        if (didScroll.current || params?.anchor !== key) return;

        InteractionManager.runAfterInteractions(() => {
          scrollRef.current?.scrollTo({ y, animated: true });
          didScroll.current = true;
        });
      },
    [params?.anchor],
  );

  return (
    <ScrollView ref={scrollRef} style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.section}>
          <ThemeSwitcher />
        </View>
        <View style={styles.section}>
          <ParamsEmergencyCall data={data} />
        </View>
        <View style={styles.section}>
          <ParamsNotifications data={data} />
        </View>
        <View style={styles.section}>
          <ParamsRadius data={data} />
        </View>
        <View style={styles.section}>
          <SentryOptOut />
        </View>
        <View onLayout={recordLayout("permissions")} style={styles.section}>
          <Permissions />
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles(({ fontSize }) => ({
  scrollView: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  container: {
    flexDirection: "column",
    paddingBottom: 50,
  },
  section: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
}));
