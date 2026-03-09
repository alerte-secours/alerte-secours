import { useCallback } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_ALERT_LEVEL_MUTATION } from "./gql";
import FieldAlertLevel from "~/containers/FieldAlertLevel";

export default function ACOFieldLevel(props) {
  const { alert } = props;
  const { id: alertId } = alert;
  const [updateAlertLevelMutation] = useMutation(UPDATE_ALERT_LEVEL_MUTATION);
  const setLevel = useCallback(
    (level) => {
      updateAlertLevelMutation({
        variables: {
          alertId,
          level,
        },
      });
    },
    [alertId, updateAlertLevelMutation],
  );
  return <FieldAlertLevel level={alert.level} setValue={setLevel} {...props} />;
}
