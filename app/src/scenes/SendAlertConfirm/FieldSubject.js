import { useFormContext } from "react-hook-form";

import FieldAlertSubject from "~/containers/FieldAlertSubject";
import { useCallback } from "react";

export default function SACFieldSubject(props) {
  const { watch, setValue } = useFormContext();
  const level = watch("level");
  const subject = watch("subject");
  const setValueLevel = useCallback(
    (level) => {
      setValue("level", level);
    },
    [setValue],
  );
  const setValueSubject = useCallback(
    (subject) => {
      setValue("subject", subject);
    },
    [setValue],
  );
  return (
    <FieldAlertSubject
      level={level}
      subject={subject}
      setValueLevel={setValueLevel}
      setValueSubject={setValueSubject}
      {...props}
    />
  );
}
