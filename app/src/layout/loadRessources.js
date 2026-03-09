import { loadAsync } from "expo-font";

const fonts = {
  "OpenSans-Regular": require("~/assets/fonts/OpenSans-Regular.ttf"),
  // 'OpenSans-Light': require("~/assets/fonts/OpenSans-Light.ttf"),
  // 'OpenSans-Bold': require("~/assets/fonts/OpenSans-Bold.ttf"),
  // 'OpenSans-ExtraBold': require("~/assets/fonts/OpenSans-ExtraBold.ttf"),
  // 'OpenSans-SemiBold': require("~/assets/fonts/OpenSans-SemiBold.ttf"),
};

export default async function loadRessources() {
  // await new Promise(resolve => setTimeout(resolve, 2000))
  await loadAsync(fonts);
}
