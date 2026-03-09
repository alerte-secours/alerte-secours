import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Title, ToggleButton, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { createStyles, fontFamily, useTheme } from "~/theme";

import Text from "~/components/Text";

import AlertRow from "~/containers/AlertRow";

import { useAlertState, useParamsState, paramsActions } from "~/stores";

import NewAlertButton from "~/containers/NewAlertButton";

import { sortFunctions, sortedByLabels } from "~/data/sorting";
import withConnectivity from "~/hoc/withConnectivity";

export default withConnectivity(function AlertAggList() {
  const styles = useStyles();
  const { colors, custom } = useTheme();
  const navigation = useNavigation();

  const { alertingList } = useAlertState(["alertingList"]);

  const { alertListSortBy: sortBy } = useParamsState(["alertListSortBy"]);
  const [relativeFirstEnabled, setRelativeFirstEnabled] = useState(true);

  const listOpen = useMemo(() => {
    const sortingList = alertingList.filter(
      ({ alert: { state } }) => state === "open",
    );
    sortFunctions[sortBy](sortingList, { relativeFirstEnabled });
    return sortingList;
  }, [alertingList, sortBy, relativeFirstEnabled]);

  const listClosed = useMemo(() => {
    const sortingList = alertingList.filter(
      ({ alert: { state } }) => state !== "open",
    );
    sortFunctions[sortBy](sortingList, { relativeFirstEnabled });
    return sortingList;
  }, [alertingList, sortBy, relativeFirstEnabled]);

  const hasRelatives = useMemo(
    () => listOpen.some((alerting) => alerting.reason === "relative"),
    [listOpen],
  );

  const listLength = alertingList.length;

  const sortedByLabel = sortedByLabels[sortBy];

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.topContainer}>
          <View style={styles.head}>
            <View style={styles.headerLeftContainer}>
              <ToggleButton.Group
                onValueChange={(value) =>
                  value && paramsActions.setAlertListSortBy(value)
                }
                value={sortBy}
              >
                <ToggleButton
                  style={[
                    styles.sortByButton,
                    sortBy === "location" && styles.sortByButtonActive,
                  ]}
                  icon={() => (
                    <MaterialCommunityIcons
                      name="target"
                      size={20}
                      style={[
                        styles.sortByButtonIcon,
                        sortBy === "location" && styles.sortByButtonIconActive,
                      ]}
                    />
                  )}
                  value="location"
                />
                <ToggleButton
                  style={[
                    styles.sortByButton,
                    sortBy === "createdAt" && styles.sortByButtonActive,
                  ]}
                  icon={() => (
                    <MaterialCommunityIcons
                      name="clock-time-four-outline"
                      size={20}
                      style={[
                        styles.sortByButtonIcon,
                        sortBy === "createdAt" && styles.sortByButtonIconActive,
                      ]}
                    />
                  )}
                  value="createdAt"
                />
                <ToggleButton
                  style={[
                    styles.sortByButton,
                    sortBy === "alphabetical" && styles.sortByButtonActive,
                  ]}
                  icon={() => (
                    <MaterialCommunityIcons
                      name="alphabetical"
                      size={20}
                      style={[
                        styles.sortByButtonIcon,
                        sortBy === "alphabetical" &&
                          styles.sortByButtonIconActive,
                      ]}
                    />
                  )}
                  value="alphabetical"
                />
              </ToggleButton.Group>
              <ToggleButton
                onPress={() => setRelativeFirstEnabled(!relativeFirstEnabled)}
                style={[
                  styles.sortByButton,
                  relativeFirstEnabled && styles.sortByButtonActive,
                ]}
                icon={() => (
                  <MaterialCommunityIcons
                    name="account-star-outline"
                    size={20}
                    style={[
                      styles.sortByButtonIcon,
                      relativeFirstEnabled && styles.sortByButtonIconActive,
                    ]}
                  />
                )}
                status={relativeFirstEnabled ? "checked" : "unchecked"}
              />
            </View>
            <View style={styles.headerRightContainer}>
              <NewAlertButton compact />
            </View>
          </View>

          <Title style={styles.title}>Alertes triées par {sortedByLabel}</Title>
          {relativeFirstEnabled && hasRelatives && (
            <Title style={styles.title}>mes proches en premier</Title>
          )}
          <View>
            {listLength === 0 && (
              <View key="empty-list" style={styles.emptyListContainer}>
                <Text style={styles.emptyListLabel}>Aucune alerte</Text>
              </View>
            )}
            <View key="list-open" style={styles.listContainer}>
              {listOpen.map((row, index) => {
                const isFirst = index === 0;
                const isLast = index + 1 === listLength;
                return (
                  <AlertRow
                    key={row.id + " " + index}
                    row={row}
                    sortBy={sortBy}
                    isFirst={isFirst}
                    isLast={isLast}
                  />
                );
              })}
            </View>
            <View key="list-closed" style={styles.listContainer}>
              {listClosed.length > 0 && (
                <Title style={styles.sectionTitle}>Alertes terminées</Title>
              )}
              {listClosed.map((row, index) => {
                const isFirst = index === 0;
                const isLast = index + 1 === listLength;
                return (
                  <AlertRow
                    key={row.id + " " + index}
                    row={row}
                    sortBy={sortBy}
                    isFirst={isFirst}
                    isLast={isLast}
                  />
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <Button
            mode="contained"
            style={styles.archivedAlertAggButton}
            icon={() => (
              <MaterialCommunityIcons
                name="archive-outline"
                size={22}
                style={styles.archivedAlertAggIcon}
              />
            )}
            uppercase={true}
            onPress={() => {
              navigation.navigate("AlertAggListArchived");
            }}
            contentStyle={styles.archivedAlertAggContent}
            labelStyle={styles.archivedAlertAggLabel}
          >
            Alertes archivées
          </Button>
        </View>
      </View>
    </ScrollView>
  );
});

const useStyles = createStyles(
  ({ wp, hp, scaleText, scheme, theme: { colors } }) => ({
    container: {
      paddingTop: hp(2),
      paddingBottom: hp(2),
      marginHorizontal: wp(3),
    },
    topContainer: {},
    bottomContainer: {
      position: "relative",
      paddingVertical: 5,
    },
    head: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerLeftContainer: {
      flexDirection: "row",
    },
    headerRightContainer: {},
    sortByButton: {
      height: 32,
      width: 32,
      ...(scheme === "dark" ? { backgroundColor: colors.surface } : {}),
    },
    sortByButtonActive: {
      ...(scheme === "dark"
        ? { backgroundColor: colors.surfaceSecondary }
        : {}),
    },
    sortByButtonIcon: {
      color: colors.onSurface,
    },
    sortByButtonIconActive: {
      color: colors.onSurface,
    },
    title: {
      fontSize: 13,
      fontFamily,
      lineHeight: 18,
    },
    sectionTitle: {
      marginTop: 10,
      paddingVertical: 10,
      fontSize: 18,
      fontWeight: "bold",
      fontFamily,
      lineHeight: 18,
      textAlign: "center",
    },
    emptyListContainer: {
      paddingVertical: 50,
    },
    emptyListLabel: {
      textAlign: "center",
    },
    listContainer: {
      flex: 1,
      flexDirection: "column",
      padding: 0,
      margin: 0,
    },
    archivedAlertAggButton: {
      marginTop: 25,
      marginBottom: 15,
    },
    archivedAlertAggContent: {},
    archivedAlertAggIcon: {
      paddingRight: 10,
      color: colors.onPrimary,
    },
    archivedAlertAggLabel: {
      // fontSize: 20,
      fontWeight: "bold",
      fontFamily,
      marginLeft: 10,
    },
  }),
);
