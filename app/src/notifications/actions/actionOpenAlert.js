import { navActions, alertActions } from "~/stores";

export default function actionOpenAlert({ data, tab }) {
  const { alertId } = data;
  const alert = {
    id: alertId,
  };
  alertActions.setNavAlertCur({ alert });
  navActions.setNextNavigation([
    {
      name: "AlertCur",
      params: {
        screen: "AlertCurTab",
        ...(tab
          ? {
              params: {
                screen: tab,
              },
            }
          : {}),
      },
    },
  ]);
}
