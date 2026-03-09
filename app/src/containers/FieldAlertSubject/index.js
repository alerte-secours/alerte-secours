import React, { createRef, useMemo, useState } from "react";
import { View } from "react-native";
import { IconButton, Divider, List } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import useKeyboardHeight from "~/lib/native/useKeyboardHeight";
import {
  useColorScheme,
  createStyles,
  createStyleOptions,
  fontFamily,
} from "~/theme";
import Autocomplete from "~/components/Autocomplete";
import findAlertTitle from "~/finders/alertTitle";

import OutlinedInputText from "~/components/OutlinedInputText";

export default function FieldSubject({
  style,
  setParentScrollEnabled,
  setUsedSubject,
  level,
  subject,
  setValueLevel,
  setValueSubject,
  selectValueSubject,
  onBlur,
}) {
  const scheme = useColorScheme();
  const styleOptions = useStyleOptions();
  const styles = useStyles();

  const titleAutocompleteList = useMemo(() => {
    const term = subject?.trimStart() || "";
    let results = findAlertTitle(term);
    results = [...results].sort((a, b) => {
      if (a.level !== b.level) {
        // order with nearest level
        if (a.level == level) {
          return -1;
        }
        if (b.level == level) {
          return 1;
        }
        switch (level) {
          case "red":
            if (a.level == "yellow") {
              return -1;
            }
            if (b.level == "yellow") {
              return 1;
            }
            break;
          case "yellow":
            if (a.level == "red") {
              return -1;
            }
            if (b.level == "red") {
              return 1;
            }
            break;
          case "green":
            if (a.level == "yellow") {
              return -1;
            }
            if (b.level == "yellow") {
              return 1;
            }
            break;
        }
      }
      if (term === "") {
        // alphabetical
        return a.title.localeCompare(b.title);
      } else {
        // instead of sorting by title first letter, keep the original order
        return 0;
      }
    });

    if (
      term !== "" &&
      undefined === results.find((item) => item.title === term)
    ) {
      results.unshift({
        id: "custom",
        title: term,
      });
    }
    // console.log("results", results);
    return results;
  }, [subject, level]);

  const inputRef = createRef();

  const [showResults, setShowResults] = useState(false);
  const [focused, setFocused] = useState(false);

  function displayShowResults(state) {
    setShowResults(state);
    setParentScrollEnabled(!state);
  }

  function selectItem(item) {
    setValueSubject(item.title);
    selectValueSubject && selectValueSubject(item.title);
    if (item.level) {
      setValueLevel && setValueLevel(item.level);
    }
    inputRef.current?.blur();
  }

  const keyboardHeight = useKeyboardHeight();
  const autocompleteListContainer = {
    maxHeight: styles.autocompleteListContainer.maxHeight - keyboardHeight,
  };

  return (
    <View style={[styles.container, style]}>
      <Autocomplete
        data={titleAutocompleteList}
        keyExtractor={(item) => item.id}
        inputContainerStyle={styles.autocompleteInputContainer}
        listContainerStyle={[
          styles.autocompleteListContainer,
          autocompleteListContainer,
        ]}
        listContentContainerStyle={styles.autocompleteListContentContainer}
        listStyle={[styles.autocompleteList]}
        renderSeparator={() => <Divider />}
        renderItem={(item) => (
          <List.Item
            title={item.title}
            right={() => {
              if (!item.level) {
                return null;
              }
              return (
                <View style={styles.autocompleteItemIconContainer}>
                  <MaterialCommunityIcons
                    name="circle"
                    color={styleOptions.levelColors[item.level]}
                    style={styles.autocompleteItemIcon}
                  />
                </View>
              );
            }}
            onPress={() => selectItem(item)}
            style={styles.autocompleteItem}
            titleStyle={styles.autocompleteItemTitle}
          />
        )}
        showResults={showResults}
        listProps={{
          nestedScrollEnabled: true,
          ItemSeparatorComponent: Divider,
        }}
        renderTextInput={() => (
          <LinearGradient
            {...styleOptions.gradientProps}
            style={styles.linearGradient}
          >
            <OutlinedInputText
              ref={inputRef}
              label="Sujet de l'alerte"
              value={subject}
              style={[styles.textField, focused && styles.textFieldFocused]}
              inputStyle={styles.textFieldInput}
              labelStyle={styles.textFieldLabel}
              onFocus={() => {
                if (subject) {
                  displayShowResults(true);
                }
                setUsedSubject && setUsedSubject(true);
                setFocused(true);
              }}
              onBlur={() => {
                displayShowResults(false);
                setFocused(false);
                onBlur && onBlur(false);
              }}
              onEndEditing={() => displayShowResults(false)}
              onChangeText={(text) => {
                setValueSubject(text);
                displayShowResults(text !== "");
              }}
              placeholder="En deux mots, décrivez votre alerte..."
              underlineColorAndroid="transparent"
              keyboardAppearance={scheme === "dark" ? "dark" : "light"}
            />
            <View style={styles.textFieldDropdownContainer}>
              <IconButton
                onPress={() => {
                  if (inputRef.current.isFocused()) {
                    if (!showResults) {
                      displayShowResults(true);
                    } else {
                      if (subject !== "") {
                        inputRef.current.blur();
                      } else {
                        displayShowResults(false);
                      }
                    }
                  } else {
                    inputRef.current.focus();
                    displayShowResults(true);
                  }
                }}
                style={styles.textFieldDropdownBtn}
                size={styleOptions.dropdownBtn.size}
                icon={({ style, ...props }) => (
                  <MaterialCommunityIcons
                    keyboardShouldPersistTaps="always"
                    name={
                      showResults
                        ? subject
                          ? "checkbox-marked-circle-outline"
                          : "chevron-up"
                        : "chevron-down"
                    }
                    style={[style, styles.textFieldDropdownIcon]}
                    {...props}
                  />
                )}
              />
            </View>
          </LinearGradient>
        )}
      />
    </View>
  );
}

const useStyleOptions = createStyleOptions(
  ({ wp, hp, fontSize, theme: { colors, custom } }) => ({
    gradientProps: {
      colors: [colors.background, colors.surface, colors.surface],
      locations: [0.1, 0.2, 1.0],
    },
    levelColors: {
      red: custom.appColors.red,
      yellow: custom.appColors.yellow,
      green: custom.appColors.green,
    },
    dropdownBtn: {
      size: fontSize(24),
    },
  }),
);

const useStyles = createStyles(
  ({ wp, hp, scaleText, fontSize, theme: { colors, textShadowForWhite } }) => ({
    container: {
      marginTop: hp(3),
    },
    linearGradient: {
      overflow: "visible",
    },
    textField: {
      paddingVertical: hp(2),
      paddingHorizontal: wp(2),
      borderColor: colors.outline,
    },
    textFieldFocused: {
      borderColor: colors.primary,
    },
    textFieldInput: {
      backgroundColor: "transparent",
      height: fontSize(16) * 1.5,
      fontSize: fontSize(16),
      color: colors.onBackground,
      paddingLeft: wp(2),
      paddingRight: wp(2) + fontSize(32),
    },
    textFieldLabel: {
      fontFamily,
      fontSize: fontSize(12),
      lineHeight: fontSize(12),
      top: fontSize(-12) / 2,
      backgroundColor: colors.background,
      color: colors.outline,
    },
    textFieldDropdownContainer: {
      position: "absolute",
      right: 0,
      flex: 1,
      height: "100%",
      justifyContent: "center",
    },
    textFieldDropdownBtn: {
      marginHorizontal: wp(1),
      zIndex: 2,
      color: colors.onBackground,
    },
    textFieldDropdownIcon: {
      color: colors.onBackground,
    },

    autocompleteInputContainer: {
      margin: 0,
    },
    autocompleteListContainer: {
      top: (-1 * fontSize(16)) / 4,
      zIndex: 2,
      borderWidth: 1,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      maxHeight: hp(60),
    },
    autocompleteListContentContainer: {},
    autocompleteList: {
      marginVertical: 0,
    },
    autocompleteItem: {
      maxHeight: 45,
    },
    autocompleteItemTitle: {
      ...scaleText({ fontSize: 14 }),
      color: colors.onBackground,
    },
    autocompleteItemIconContainer: {
      justifyContent: "center",
      height: "100%",
    },
    autocompleteItemIcon: {
      fontSize: fontSize(14),
    },
  }),
);
