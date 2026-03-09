import React, { useRef, useState, useCallback, useEffect } from "react";
import { TextInput, Platform, InteractionManager } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createStyles, useTheme } from "~/theme";

export default React.memo(function TextArea({
  value,
  onChangeText,
  autoFocus,
  inputRef,
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const textInputRef = useRef(null);
  const didAutoFocusRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

  const setRefs = useCallback(
    (node) => {
      textInputRef.current = node;
      if (!inputRef) return;
      if (typeof inputRef === "function") {
        inputRef(node);
      } else {
        inputRef.current = node;
      }
    },
    [inputRef],
  );

  useFocusEffect(
    useCallback(() => {
      let timeout;
      const task = InteractionManager.runAfterInteractions(() => {
        timeout = setTimeout(() => {
          // Only auto-focus once per screen visit; re-focusing later can cause
          // unwanted focus jumps for screen reader users.
          if (autoFocus && textInputRef.current && !didAutoFocusRef.current) {
            didAutoFocusRef.current = true;
            textInputRef.current.focus();
          }
        }, 500);
      });
      return () => {
        task.cancel();
        clearTimeout(timeout);
        setKeyboardEnabled(false);
      };
    }, [autoFocus]),
  );

  const onBlur = useCallback(() => {
    setIsFocused(false);
    setKeyboardEnabled(false);
  }, []);

  useEffect(() => {
    if (
      !keyboardEnabled &&
      autoFocus &&
      !isFocused &&
      textInputRef.current &&
      !didAutoFocusRef.current
    ) {
      setTimeout(() => {
        didAutoFocusRef.current = true;
        textInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus, isFocused, keyboardEnabled]);

  return (
    <TextInput
      testID="chat-input-text"
      accessibilityLabel="Message"
      accessibilityHint="Saisissez votre message."
      multiline
      maxLength={4096}
      style={styles.input}
      onChangeText={onChangeText}
      value={value}
      ref={setRefs}
      textAlignVertical="center"
      autoFocus={autoFocus}
      showSoftInputOnFocus={keyboardEnabled} // controlled by state
      placeholder="Message"
      placeholderTextColor={colors.placeholder}
      onTouchStart={() => {
        if (!keyboardEnabled) {
          setKeyboardEnabled(true);
          // Wait a tick so that the TextInput re-renders with the new prop
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 100);
        }
      }}
      onBlur={onBlur}
      onFocus={() => {
        setIsFocused(true);
      }}
    />
  );
});

const useStyles = createStyles(({ fontSize, wp, theme: { colors } }) => ({
  input: {
    flex: 1,
    color: colors.onBackground,
    fontSize: fontSize(14),
    height: "100%",
    textAlignVertical: "center",
    ...Platform.select({
      ios: {
        paddingTop: 10,
        paddingBottom: 10,
        lineHeight: 20,
      },
    }),
  },
}));
