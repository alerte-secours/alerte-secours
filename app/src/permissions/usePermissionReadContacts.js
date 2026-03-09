import { useEffect } from "react";

import { usePermissionsState, permissionsActions } from "~/stores";

import requestPermissionReadContacts from "./requestPermissionReadContacts";

export default function usePermissionReadContacts() {
  const { setReadContacts } = permissionsActions;
  const { readContacts } = usePermissionsState(["readContacts"]);

  useEffect(() => {
    if (readContacts) {
      return;
    }
    (async () => {
      const granted = await requestPermissionReadContacts();

      setReadContacts(granted);
    })();
  }, [readContacts, setReadContacts]);

  return { ready: readContacts };
}
