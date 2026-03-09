import { useMutation } from "@apollo/client";
import INSERT_ONE_MESSAGE_MUTATION from "~/gql/mutations/insertOneMessage";
import { SELECT_MANY_MESSAGE_QUERY } from "~/containers/MessagesFetcher/gql";

export default function useInsertMessage(alertId) {
  const [insertOneMessageMutation] = useMutation(INSERT_ONE_MESSAGE_MUTATION);

  const insertMessage = async ({
    text,
    location = null,
    username = "",
    userId = null,
  }) => {
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      __typename: "message",
      id: optimisticId,
      alertId,
      createdAt: new Date().toISOString(),
      location,
      contentType: "text",
      text,
      audioFileUuid: null,
      username,
      userId,
      avatarImageFileUuid: null,
      isOptimistic: true,
    };

    try {
      const result = await insertOneMessageMutation({
        variables: {
          alertId,
          text,
          location,
        },
        optimisticResponse: {
          __typename: "mutation_root",
          insertOneMessage: optimisticMessage,
        },
        update(cache, { data }) {
          // Update alert-specific view
          const alertCacheId = cache.identify({
            __typename: "Query",
            alertId,
          });

          const existingAlertData = cache.readQuery({
            query: SELECT_MANY_MESSAGE_QUERY,
            variables: { alertId },
            context: {
              cacheKey: `alert:${alertId}`,
            },
          });

          if (existingAlertData) {
            const existingMessages = existingAlertData.selectManyMessage || [];
            const newMessage = data?.insertOneMessage;

            if (newMessage) {
              // If this is the optimistic response
              if (newMessage.isOptimistic) {
                cache.writeQuery({
                  query: SELECT_MANY_MESSAGE_QUERY,
                  variables: { alertId },
                  context: {
                    cacheKey: `alert:${alertId}`,
                  },
                  data: {
                    selectManyMessage: [...existingMessages, newMessage],
                  },
                });
              } else {
                // This is the real response, remove optimistic version
                const filteredMessages = existingMessages.filter(
                  (msg) =>
                    !(
                      msg.isOptimistic &&
                      msg.text === newMessage.text &&
                      msg.alertId === alertId
                    ),
                );
                cache.writeQuery({
                  query: SELECT_MANY_MESSAGE_QUERY,
                  variables: { alertId },
                  context: {
                    cacheKey: `alert:${alertId}`,
                  },
                  data: {
                    selectManyMessage: [...filteredMessages, newMessage],
                  },
                });
              }
            }
          }

          // Update aggregate view
          const existingAggData = cache.readQuery({
            query: SELECT_MANY_MESSAGE_QUERY,
            variables: {},
            context: {
              cacheKey: "aggregate-messages",
            },
          });

          if (existingAggData) {
            const existingMessages = existingAggData.selectManyMessage || [];
            const newMessage = data?.insertOneMessage;

            if (newMessage) {
              if (newMessage.isOptimistic) {
                cache.writeQuery({
                  query: SELECT_MANY_MESSAGE_QUERY,
                  variables: {},
                  context: {
                    cacheKey: "aggregate-messages",
                  },
                  data: {
                    selectManyMessage: [...existingMessages, newMessage],
                  },
                });
              } else {
                const filteredMessages = existingMessages.filter(
                  (msg) =>
                    !(
                      msg.isOptimistic &&
                      msg.text === newMessage.text &&
                      msg.alertId === alertId
                    ),
                );
                cache.writeQuery({
                  query: SELECT_MANY_MESSAGE_QUERY,
                  variables: {},
                  context: {
                    cacheKey: "aggregate-messages",
                  },
                  data: {
                    selectManyMessage: [...filteredMessages, newMessage],
                  },
                });
              }
            }
          }
        },
      });

      return result;
    } catch (error) {
      console.error("Mutation error:", error);
      throw error;
    }
  };

  return insertMessage;
}
