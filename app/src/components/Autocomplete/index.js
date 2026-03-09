import React, { createRef, useEffect, Fragment } from "react";
import { StyleSheet, Text, TextInput, View, ScrollView } from "react-native";
import { List } from "react-native-paper";

export default function Autocomplete(props) {
  props = {
    data: [],
    onStartShouldSetResponderCapture: () => false,
    renderItem: ({ item }) => <Text>{item}</Text>,
    renderSeparator: null,
    renderTextInput: (props) => <TextInput {...props} />,
    keyExtractor: (item) => item,
    ...props,
  };

  const {
    data,
    containerStyle,
    showResults,
    listContainerStyle,
    listContentContainerStyle,
    inputContainerStyle,
    inputStyle,
    onShowResults,
    onStartShouldSetResponderCapture,
  } = props;

  const textInputRef = createRef();

  function onEndEditing(e) {
    props.onEndEditing && props.onEndEditing(e);
  }

  function blur() {
    textInputRef.current?.blur();
  }

  function focus() {
    textInputRef.current?.focus();
  }

  function isFocused() {
    textInputRef.current?.isFocused();
  }

  function renderResultList() {
    const { data, listStyle, renderItem, renderSeparator, keyExtractor } =
      props;
    const endIndex = data.length - 1;
    return (
      <List.Section style={[styles.list, listStyle]}>
        {data.map((item, index) => {
          let key = keyExtractor(item, index);
          return (
            <Fragment key={key}>
              {renderItem(item)}
              {index < endIndex && renderSeparator && renderSeparator()}
            </Fragment>
          );
        })}
      </List.Section>
    );
  }

  function renderTextInput() {
    return props.renderTextInput({
      style: [inputStyle],
      ref: textInputRef,
      onEndEditing: onEndEditing,
      ...props,
    });
  }

  const hasResults = data.length > 0;

  onShowResults && onShowResults(hasResults);

  const scrollViewRef = createRef();

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [data, scrollViewRef]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputContainer, inputContainerStyle]}>
        {renderTextInput()}
      </View>
      {showResults && (
        <View style={listContainerStyle}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={listContentContainerStyle}
            onStartShouldSetResponderCapture={onStartShouldSetResponderCapture}
            keyboardShouldPersistTaps="handled"
          >
            {hasResults && renderResultList()}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  inputContainer: {},
  list: {},
});
