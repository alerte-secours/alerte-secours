import React, { useEffect, useRef, useState } from "react";
import ToastContext from "./context";
import Toast from "../toastContainer";

function ToastProvider({ children, ...props }) {
  const toastRef = useRef(null);
  const [refState, setRefState] = useState({});

  useEffect(() => {
    setRefState(toastRef.current);
  }, []);

  return (
    <ToastContext.Provider value={refState}>
      {children}
      <Toast ref={toastRef} {...props} />
    </ToastContext.Provider>
  );
}

export default ToastProvider;
