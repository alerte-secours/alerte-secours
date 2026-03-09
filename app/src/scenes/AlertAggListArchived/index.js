import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Title, ToggleButton, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useStreamQueryWithSubscription from "~/hooks/useStreamQueryWithSubscription";

import { createStyles, fontFamily, useTheme } from "~/theme";

import Text from "~/components/Text";

import AlertRow from "~/containers/AlertRow";

import { ALERTED_SUBSCRIPTION, ALERTED_QUERY } from "./gql";

import { sortFunctions, sortedByLabels } from "~/data/sorting";
import Loader from "~/components/Loader";
import withConnectivity from "~/hoc/withConnectivity";

export default withConnectivity(function AlertAggListArchived() {
  const styles = useStyles();
  const { colors, custom } = useTheme();

  const { data, loading } = useStreamQueryWithSubscription(
    ALERTED_QUERY,
    ALERTED_SUBSCRIPTION,
    {
      cursorVar: "cursor",
      cursorKey: "id",
      uniqKey: "id",
    },
  );

  const [sortBy, setSortBy] = useState("createdAt");

  const listArchived = useMemo(() => {
    if (!data) {
      return [];
    }
    const sortingList = data.selectManyAlerted.map((alerted) => {
      return {
        ...alerted,
        alert: {
          ...alerted.oneArchivedAlert,
          distance: false,
          state: "archived",
        },
      };
    });
    sortFunctions[sortBy](sortingList);
    return sortingList;
  }, [data, sortBy]);

  const sortedByLabel = sortedByLabels[sortBy];

  if (loading) {
    return <Loader />;
  }

  const listLength = listArchived.length;

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.topContainer}>
          <View style={styles.head}>
            <View style={styles.headerLeftContainer}>
              <ToggleButton.Group
                onValueChange={(value) => value && setSortBy(value)}
                value={sortBy}
              >
                <ToggleButton
                  style={[
                    styles.sortByButton,
                    sortBy === "createdAt" && styles.sortByButtonSelected,
                  ]}
                  icon={() => (
                    // <MaterialIcons
                    //   name="access-time"
                    //   size={20}
                    //   color={colors.surfaceSecondary}
                    // />
                    <MaterialCommunityIcons
                      name="clock-time-four-outline"
                      size={20}
                      color={
                        sortBy === "createdAt"
                          ? colors.onPrimary
                          : colors.onSurfaceVariant
                      }
                    />
                  )}
                  value="createdAt"
                />
                <ToggleButton
                  style={[
                    styles.sortByButton,
                    sortBy === "alphabetical" && styles.sortByButtonSelected,
                  ]}
                  icon={() => (
                    <MaterialCommunityIcons
                      name="alphabetical"
                      size={20}
                      color={
                        sortBy === "alphabetical"
                          ? colors.onPrimary
                          : colors.onSurfaceVariant
                      }
                    />
                  )}
                  value="alphabetical"
                />
              </ToggleButton.Group>
            </View>
            <View style={styles.headerRightContainer}></View>
          </View>

          <Title style={styles.title}>Alertes triées par {sortedByLabel}</Title>
          <View>
            {listLength === 0 && (
              <View key="empty-list" style={styles.emptyListContainer}>
                <Text style={styles.emptyListLabel}>
                  Aucune alerte archivée
                </Text>
              </View>
            )}
            <View key="list-archived" style={styles.listContainer}>
              {listLength > 0 && (
                <Title style={styles.sectionTitle}>Alertes archivées</Title>
              )}
              {listArchived.map((row, index) => {
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
      </View>
    </ScrollView>
  );
});

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  sortByButtonSelected: {
    backgroundColor: colors.primary,
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
  },
  archivedAlertAggLabel: {
    // fontSize: 20,
    fontWeight: "bold",
    fontFamily,
    marginLeft: 10,
  },
}));
