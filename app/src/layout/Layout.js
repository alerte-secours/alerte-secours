import React, { useState, useEffect, useCallback } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";

import * as SplashScreen from "expo-splash-screen";

import RootStack from "~/navigation/RootStack";

import LayoutProviders from "~/layout/LayoutProviders";
import loadRessources from "~/layout/loadRessources";
import useMount from "~/hooks/useMount";

import { treeActions } from "~/stores";

SplashScreen.preventAutoHideAsync();

export default function AppView() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [layoutKey, setLayoutKey] = useState(0);

  useMount(() => {
    (async () => {
      try {
        await loadRessources();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    })();
  });

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
      treeActions.splashScreenHidden();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      <View
        key={layoutKey}
        onLayout={onLayoutRootView}
        style={{ flex: 1 }}
        testID="main-layout"
      >
        <LayoutProviders layoutKey={layoutKey} setLayoutKey={setLayoutKey}>
          <RootStack />
        </LayoutProviders>
      </View>
    </KeyboardAvoidingView>
  );
}
