import { InMemoryCache, defaultDataIdFromObject } from "@apollo/client";

export default function createCache() {
  return new InMemoryCache({
    dataIdFromObject(responseObject) {
      switch (responseObject.__typename) {
        case "message":
          return `Message:${responseObject.id}`;
        case "archived_message":
          return `ArchivedMessage:${responseObject.id}`;
        case "alert":
          return `Alert:${responseObject.id}`;
        default:
          return defaultDataIdFromObject(responseObject);
      }
    },
    typePolicies: {
      Query: {
        fields: {
          selectManyMessage: {
            // Simple merge that preserves order
            merge(existing = [], incoming = [], { readField }) {
              const merged = new Map();

              // Add existing items
              existing?.forEach((item) => {
                const id = readField("id", item);
                merged.set(id, item);
              });

              // Add new items, respecting optimistic updates
              incoming?.forEach((item) => {
                const id = readField("id", item);
                const isOptimistic = readField("isOptimistic", item);
                const existing = merged.get(id);

                if (!existing || (existing.isOptimistic && !isOptimistic)) {
                  merged.set(id, item);
                }
              });

              return Array.from(merged.values()).sort((a, b) => {
                const aId = readField("id", a);
                const bId = readField("id", b);
                return aId - bId;
              });
            },
          },
          selectManyArchivedMessage: {
            merge(existing = [], incoming = [], { readField }) {
              const merged = new Map();

              // Simple merge for archived messages
              [...(existing || []), ...(incoming || [])].forEach((item) => {
                const id = readField("id", item);
                merged.set(id, item);
              });

              return Array.from(merged.values()).sort((a, b) => {
                const aId = readField("id", a);
                const bId = readField("id", b);
                return aId - bId;
              });
            },
          },
        },
      },
      message: {
        keyFields: ["id", "alertId"],
        fields: {
          isOptimistic: {
            read(existing) {
              return existing ?? false;
            },
          },
          // Handle oneAlert field for aggregate view
          oneAlert: {
            merge: true, // Let Apollo handle merging alert objects
          },
        },
      },
      alert: {
        keyFields: ["id"],
      },
      archived_message: {
        keyFields: ["id", "archivedAlertId"],
      },
    },
  });
}
