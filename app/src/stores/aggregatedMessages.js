import { createAtom } from "~/lib/atomic-zustand";
import debounce from "lodash.debounce";
import AsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";

export default createAtom(({ merge, set, get, reset }) => {
  const overrideMessagesCache = {};

  const initCache = async () => {
    try {
      const storedData = await AsyncStorage.getItem(
        STORAGE_KEYS.OVERRIDE_MESSAGES,
      );
      const storedMessages = storedData ? JSON.parse(storedData) : {};
      Object.entries(storedMessages).forEach(([messageId, data]) => {
        overrideMessagesCache[messageId] = data;
      });
      console.log("Initialized override messages cache");
    } catch (error) {
      console.log("Error initializing override messages cache:", error);
    }
  };
  const saveOverrideMessagesToStorage = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OVERRIDE_MESSAGES,
        JSON.stringify(overrideMessagesCache),
      );
    } catch (error) {
      console.log("Error saving override message status:", error);
    }
  };

  const saveMultipleReadMessagesToStorage = async (messageIds) => {
    messageIds.forEach((messageId) => {
      if (!overrideMessagesCache[messageId]) {
        overrideMessagesCache[messageId] = {};
      }
      overrideMessagesCache[messageId].isRead = true;
    });

    await saveOverrideMessagesToStorage();
  };

  const cleanupStaleMessages = async (inputMessagesList) => {
    const { realMessagesList, virtualMessagesList } = get();
    const currentRealList = inputMessagesList || realMessagesList;

    // Collect all message IDs from both real and virtual messages
    const currentMessageIds = [
      ...currentRealList.map((message) => message.id.toString()),
      ...virtualMessagesList.map((message) => message.id.toString()),
    ];

    try {
      let hasChanges = false;
      const keysToRemove = [];
      Object.keys(overrideMessagesCache).forEach((messageId) => {
        if (!currentMessageIds.includes(messageId)) {
          keysToRemove.push(messageId);
          hasChanges = true;
        }
      });

      keysToRemove.forEach((key) => {
        delete overrideMessagesCache[key];
      });

      if (hasChanges) {
        await saveOverrideMessagesToStorage();
      }

      return overrideMessagesCache;
    } catch (error) {
      console.log("Error cleaning up stale messages:", error);
      return overrideMessagesCache; // Return the cache even on error
    }
  };

  const getComputedProps = (messages) => {
    // console.log("overrideMessagesCache", overrideMessagesCache);

    const messagesList = messages.map((message) => {
      if (overrideMessagesCache[message.id]) {
        return {
          ...message,
          ...overrideMessagesCache[message.id],
        };
      }
      return message;
    });

    let unreadCount = 0;
    for (const message of messagesList) {
      if (!message.isRead) {
        unreadCount++;
      }
    }

    return {
      unreadCount,
      messagesList,
    };
  };

  const combineMessagesWithVirtuals = (messages, virtualMessages) => {
    const combinedMessages = [...messages];
    virtualMessages.forEach((virtualMsg) => {
      if (virtualMsg._sort === -1) {
        combinedMessages.unshift(virtualMsg);
      } else {
        let insertIndex = 0;
        while (
          insertIndex < combinedMessages.length &&
          new Date(combinedMessages[insertIndex].createdAt) <
            new Date(virtualMsg.createdAt)
        ) {
          insertIndex++;
        }

        combinedMessages.splice(insertIndex, 0, virtualMsg);
      }
    });
    return combinedMessages;
  };

  const mergeMessagesList = (options = {}) => {
    const currentState = get();
    const realMessages =
      options.realMessagesList || currentState.realMessagesList;
    const virtualMessages =
      options.virtualMessagesList || currentState.virtualMessagesList;

    const combinedMessages = combineMessagesWithVirtuals(
      realMessages,
      virtualMessages,
    );
    const computedProps = getComputedProps(combinedMessages);

    const updateObject = {
      ...computedProps,
    };

    if (options.realMessagesList) {
      updateObject.realMessagesList = options.realMessagesList;
    }

    if (options.virtualMessagesList) {
      updateObject.virtualMessagesList = options.virtualMessagesList;
    }

    merge(updateObject);
  };

  const updateMessagesList = (messages) => {
    mergeMessagesList({ realMessagesList: messages });
  };

  const replaceMessagesForAlert = (alertId, messagesForAlert) => {
    const { realMessagesList } = get();

    const remaining = realMessagesList.filter(
      (m) => m.alertId !== alertId && m.alertId !== Number(alertId),
    );

    const next = [...remaining, ...(messagesForAlert || [])];

    // Preserve global ordering by id asc.
    next.sort((a, b) => {
      const aId = a?.id;
      const bId = b?.id;
      if (typeof aId === "number" && typeof bId === "number") return aId - bId;
      return String(aId).localeCompare(String(bId));
    });

    mergeMessagesList({ realMessagesList: next });
  };

  const debouncedUpdateMessagesList = debounce(updateMessagesList, 300, {
    trailing: true,
  });

  const addVirtualMessage = (virtualMessage) => {
    const { virtualMessagesList } = get();
    const updatedVirtualList = [...virtualMessagesList, virtualMessage];
    mergeMessagesList({ virtualMessagesList: updatedVirtualList });
  };

  const addVirtualFirstMessage = (alert) => {
    const virtualMessage = {
      id: `virtual-1st-${alert.id}`,
      alertId: alert.id,
      createdAt: alert.createdAt,
      _sort: -1,
      contentType: "text",
      text: "J'ai besoin d'aide",
      username: alert.username,
      userId: alert.userId,
      avatarImageFileUuid: alert.avatarImageFileUuid,
      isRead: false,
      oneAlert: alert,
      isVirtual: true,
      isVirtualFirstMessage: true,
    };

    addVirtualMessage(virtualMessage);
  };

  const init = async (messagesList) => {
    try {
      await initCache();
      await cleanupStaleMessages(messagesList);
      mergeMessagesList({ realMessagesList: messagesList });
    } catch (error) {
      console.log("Error initializing aggregated messages:", error);
    }

    setInterval(
      async () => {
        await cleanupStaleMessages();
      },
      60 * 60 * 1000,
    );
  };

  return {
    default: {
      messagesList: [],
      realMessagesList: [], // Added realMessagesList state
      virtualMessagesList: [], // Store virtual messages separately
      unreadCount: 0,
      hasMoreMessages: false,
      cursor: null,
      loading: false,
      error: null,
    },
    actions: {
      init,
      reset,
      updateMessagesList,
      replaceMessagesForAlert,
      debouncedUpdateMessagesList,
      initializeAlert: (alert) => {
        addVirtualFirstMessage(alert);
      },
      setLoading: (loading) => {
        merge({
          loading,
        });
      },
      setError: (error) => {
        merge({
          error,
        });
      },
      markMultipleMessagesAsRead: (messageIds) => {
        if (messageIds.length === 0) {
          return;
        }

        const { realMessagesList, virtualMessagesList } = get();
        saveMultipleReadMessagesToStorage(messageIds);

        // Update realMessagesList with read status
        const updatedRealList = realMessagesList.map((message) => {
          if (messageIds.includes(message.id)) {
            return { ...message, isRead: true };
          }
          return message;
        });

        // Also update virtualMessagesList with read status
        const updatedVirtualList = virtualMessagesList.map((message) => {
          if (messageIds.includes(message.id)) {
            return { ...message, isRead: true };
          }
          return message;
        });

        // Pass both updated lists to mergeMessagesList
        mergeMessagesList({
          realMessagesList: updatedRealList,
          virtualMessagesList: updatedVirtualList,
        });
      },
    },
  };
});
