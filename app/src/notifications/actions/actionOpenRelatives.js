import { navActions } from "~/stores";

export default function actionOpenRelatives({ data }) {
  navActions.setNextNavigation([
    {
      name: "Relatives",
      params: {
        screen: "Relatives",
      },
    },
  ]);
}
