import React, { useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { List, Searchbar, Divider } from "react-native-paper";

import { useDpStyle } from "~/lib/style/dp";
import { useTheme } from "~/theme";

import terms from "~/misc/alertsList";
import findAlertTitle from "~/finders/alertTitle";

export default function SendAlertFinder(props) {
  const navigation = useNavigation();
  const { colors, custom } = useTheme();

  const [term, setTerm] = useState("");
  const [results, setResults] = useState(terms);

  function sendAlert(item) {
    const { title, level } = item;
    const params = {
      alert: {
        title,
        level,
      },
    };
    navigation.navigate("SendAlertConfirm", params);
  }

  const styles = useDpStyle(({ wp, hp }) => {
    return StyleSheet.create({
      container: {
        flex: 1,
        paddingTop: Math.max(10, hp(2)),
        paddingBottom: Math.max(10, hp(2)),
      },
      searchbar: {
        alignSelf: "center",
        width: wp(96),
      },
    });
  });

  function searchFilter(term) {
    setTerm(term);
    const newResults = findAlertTitle(term);
    setResults(newResults);
  }

  return (
    <View style={styles.container}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={results}
        renderItem={({ item }) => (
          <List.Item
            title={item.title}
            description={item.desc}
            onPress={() => sendAlert(item)}
            right={(props) => {
              return (
                <List.Icon
                  {...props}
                  icon={() => {
                    return (
                      <MaterialCommunityIcons
                        name="circle"
                        color={item.level}
                      />
                    );
                  }}
                />
              );
            }}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={
          <Searchbar
            placeholder="En un mot votre situation..."
            onChangeText={(term) => searchFilter(term)}
            value={term}
            style={[styles.searchbar]}
            autoFocus
          />
        }
      />
    </View>
  );
}
