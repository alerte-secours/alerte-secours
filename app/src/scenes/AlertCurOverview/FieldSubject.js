import { useCallback, useEffect, useState, useRef } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_ALERT_SUBJECT_MUTATION } from "./gql";

import FieldAlertSubject from "~/containers/FieldAlertSubject";

export default function ACOFieldSubject(props) {
  const { alert } = props;
  const { id: alertId } = alert;

  const [updateAlertSubjectMutation] = useMutation(
    UPDATE_ALERT_SUBJECT_MUTATION,
  );

  const [subject, setSubject] = useState(alert.subject);

  const prevSubject = useRef(alert.subject);
  useEffect(() => {
    if (prevSubject.current !== alert.subject) {
      prevSubject.current = alert.subject;
      setSubject(alert.subject);
    }
  }, [alert.subject]);

  const selectValueSubject = useCallback(
    (subject) => {
      updateAlertSubjectMutation({ variables: { alertId, subject } });
    },
    [alertId, updateAlertSubjectMutation],
  );
  const onBlur = useCallback(() => {
    selectValueSubject(subject);
  }, [selectValueSubject, subject]);

  return (
    <FieldAlertSubject
      subject={subject}
      setValueSubject={setSubject}
      selectValueSubject={selectValueSubject}
      onBlur={onBlur}
      {...props}
    />
  );
}
