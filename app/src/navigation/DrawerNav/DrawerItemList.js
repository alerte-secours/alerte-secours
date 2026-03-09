import SectionSeparator from "./SectionSeparator";
import menuItem from "./menuItem";

const index1 = 5;
const index2 = 9;

export default function DrawerItemList(props) {
  const { state } = props;
  const { index } = state;

  const routeMenuItem = (route, i) => {
    const mainFocused = i === index;
    return menuItem({
      mainFocused,
      route,
      state,
      ...props,
    });
  };

  const { routes } = state;

  const section1 = routes.slice(0, index1);
  const section2 = routes.slice(index1, index2);
  const section3 = routes.slice(index2, routes.length);

  return (
    <>
      <SectionSeparator label="Mon compte" />
      {section2.map((props, i) => routeMenuItem(props, i + index1))}
      <SectionSeparator label="Alerter" />
      {section1.map((props, i) => routeMenuItem(props, i + 0))}
      <SectionSeparator label="Infos pratiques" />
      {section3.map((props, i) => routeMenuItem(props, i + index2))}
    </>
  );
}
