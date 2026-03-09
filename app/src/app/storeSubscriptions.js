import { subscribeLocationState, alertActions } from "~/stores";

function init() {
  subscribeLocationState(
    (state) => {
      return state?.coords;
    },
    (coords) => {
      alertActions.updateLocation(coords);
    },
    true,
  );
}

export default { init };
