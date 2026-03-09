import React, { createContext, useContext, useState } from "react";
import { getDeviceCountryCode } from "~/i18n";

import useMount from "~/hooks/useMount";

const Ctx = createContext();
export function useI18n() {
  return useContext(Ctx);
}
export function Provider({ children }) {
  const [deviceCountryCode, setDeviceCountryCode] = useState(null);
  useMount(() => {
    (async () => {
      const code = await getDeviceCountryCode();
      setDeviceCountryCode(code || false);
    })();
  });
  if (deviceCountryCode === null) {
    return null;
  }
  return <Ctx.Provider value={{ deviceCountryCode }}>{children}</Ctx.Provider>;
}
