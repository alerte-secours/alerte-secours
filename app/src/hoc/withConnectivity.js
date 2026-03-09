import React from "react";
import { useNetworkState } from "~/stores";
import ConnectivityError from "~/components/ConnectivityError";

export default function withConnectivity(WrappedComponent, options = {}) {
  const { keepVisible = false } = options;

  const WithConnectivity = React.memo(function WithConnectivity(props) {
    const { hasInternetConnection } = useNetworkState([
      "hasInternetConnection",
    ]);

    if (hasInternetConnection) {
      return <WrappedComponent {...props} />;
    }

    if (!keepVisible) {
      return <ConnectivityError />;
    }

    return (
      <>
        <ConnectivityError compact />
        <WrappedComponent {...props} />
      </>
    );
  });

  // Copy static methods and properties
  WithConnectivity.displayName = `WithConnectivity(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithConnectivity;
}
