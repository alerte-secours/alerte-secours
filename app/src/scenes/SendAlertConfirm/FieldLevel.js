import { useCallback } from "react";
import { useFormContext } from "react-hook-form";

import FieldAlertLevel from "~/containers/FieldAlertLevel";

export default function SACFieldAlert(props) {
  const { watch, setValue } = useFormContext();
  const level = watch("level");
  const setValueCallback = useCallback(
    (level) => {
      switch (level) {
        case "red":
          setValue("callEmergency", true);
          setValue("notifyRelatives", true);
          break;
        case "yellow":
          setValue("callEmergency", true);
          setValue("notifyRelatives", true);
          break;
        case "green":
          setValue("callEmergency", false);
          setValue("notifyRelatives", false);
          break;
      }
      setValue("level", level);
    },
    [setValue],
  );
  return (
    <FieldAlertLevel level={level} setValue={setValueCallback} {...props} />
  );
}
