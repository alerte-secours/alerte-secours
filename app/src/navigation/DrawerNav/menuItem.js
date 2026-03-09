import { CommonActions } from "@react-navigation/native";
import { DrawerItem } from "@react-navigation/drawer";

export default function menuItem({
  state,
  route,
  mainFocused,
  navigation,
  descriptors,
  activeTintColor,
  inactiveTintColor,
  activeBackgroundColor,
  inactiveBackgroundColor,
  itemStyle,
  labelStyle,
}) {
  const {
    title,
    drawerLabel,
    drawerIcon,
    tabScreen,
    tabScreenFocused,
    onItemPress,
    hidden,
  } = descriptors[route.key].options;

  const focused = tabScreen ? tabScreenFocused : mainFocused;

  if (hidden) {
    return null;
  }

  return (
    <DrawerItem
      pressColor={"rgba(255, 255, 255, .9)"} // android
      pressOpacity={0.9} // ios
      key={route.key}
      label={
        drawerLabel !== undefined
          ? drawerLabel
          : title !== undefined
          ? title
          : route.name
      }
      icon={drawerIcon}
      focused={focused}
      activeTintColor={activeTintColor}
      inactiveTintColor={inactiveTintColor}
      activeBackgroundColor={activeBackgroundColor}
      inactiveBackgroundColor={inactiveBackgroundColor}
      labelStyle={labelStyle}
      style={itemStyle}
      onPress={
        onItemPress
          ? onItemPress
          : () => {
              let screen;
              if (tabScreen) {
                screen = tabScreen;
              }
              navigation.dispatch({
                ...CommonActions.navigate({
                  name: route.name,
                  params: { screen },
                }),
                target: state.key,
              });
            }
      }
    />
  );
}
