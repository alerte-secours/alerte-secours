import { createClient } from "graphql-ws";

export function createRestartableClient(options) {
  let restartRequested = false;
  let lastRestartTime = 0;
  let restart = () => {
    restartRequested = true;
  };

  const client = createClient({
    ...options,
    on: {
      ...options.on,
      opened: (socket) => {
        options.on?.opened?.(socket);

        restart = () => {
          if (socket.readyState === WebSocket.OPEN) {
            // if the socket is still open for the restart, do the restart
            socket.close(4205, "Client Restart");
          } else {
            // otherwise the socket might've closed, indicate that you want
            // a restart on the next opened event
            restartRequested = true;
          }
        };

        // just in case you were eager to restart
        if (restartRequested) {
          restartRequested = false;
          restart();
        }
      },
      // closed: (event) => {
      //   options.on?.closed?.(event);
      //   restart();
      // },
    },
  });

  // Important: keep the original `graphql-ws` client object identity.
  client.restart = () => {
    const now = Date.now();
    if (now - lastRestartTime < 2000) {
      // Ignore restart request if less than 2 seconds since last restart
      return;
    }
    lastRestartTime = now;
    restart();
  };

  return client;
}
