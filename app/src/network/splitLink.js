import { split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";

export default function createSplitLink({ wsLink, httpLink }) {
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    wsLink,
    httpLink,
  );

  return splitLink;
}
