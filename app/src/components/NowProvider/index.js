import React, { createContext, useState, useEffect } from "react";

// Create the context
const NowContext = createContext();

// Provider component
const NowProvider = ({ children, refreshInterval = 60000 }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
};

export { NowContext, NowProvider };
