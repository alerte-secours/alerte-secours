import React from "react";

// based on https://github.com/knpwrs/react-compose-components

export default function ComposeComponents({ components, children }) {
  return components.reduceRight((prev, curr) => {
    if (Array.isArray(curr)) {
      const [Comp, props] = curr;
      return <Comp {...props}>{prev}</Comp>;
    }
    const Comp = curr;
    return <Comp>{prev}</Comp>;
  }, children);
}
