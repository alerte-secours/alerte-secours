import React, { forwardRef } from "react";

export default function withHooks(Component, hooksCallback) {
  return forwardRef(function WrappedComponent(props, ref) {
    const hooksProps = hooksCallback(props);
    return <Component {...props} {...hooksProps} ref={ref} />;
  });
}
