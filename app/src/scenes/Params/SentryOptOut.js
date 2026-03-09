import React, { useCallback } from "react";
import { View } from "react-native";
import { Title, Switch } from "react-native-paper";
import { createStyles } from "~/theme";
import { useParamsState, paramsActions } from "~/stores";
import Text from "~/components/Text";
import { setSentryEnabled } from "~/sentry";

function SentryOptOut() {
  const styles = useStyles();
  const { sentryEnabled } = useParamsState(["sentryEnabled"]);

  const handleToggle = useCallback(async () => {
    const newValue = !sentryEnabled;
    await paramsActions.setSentryEnabled(newValue);

    // Dynamically enable/disable Sentry
    setSentryEnabled(newValue);
  }, [sentryEnabled]);

  return (
    <View style={styles.container}>
      <Title accessibilityRole="header" style={styles.title}>
        Rapport d'erreurs
      </Title>
      <View style={styles.content}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Envoyer les rapports d'erreurs</Text>
          <Switch
            value={sentryEnabled}
            onValueChange={handleToggle}
            accessibilityRole="switch"
            accessibilityLabel="Envoyer les rapports d'erreurs"
            accessibilityHint="Active ou désactive l'envoi automatique des rapports d'erreurs."
            accessibilityState={{ checked: !!sentryEnabled }}
            style={styles.switch}
          />
        </View>
        <Text style={styles.description}>
          Les rapports d'erreurs nous aident à améliorer l'application en nous
          permettant de mieux identifier et corriger les problèmes techniques.
        </Text>
      </View>
    </View>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  container: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
  },
  content: {
    width: "100%",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingVertical: 5,
  },
  label: {
    fontSize: 16,
    flex: 1,
    marginRight: 15,
  },
  switch: {
    flexShrink: 0,
  },
  description: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: "left",
    lineHeight: 20,
  },
}));

export default SentryOptOut;
