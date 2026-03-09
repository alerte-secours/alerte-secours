import { createChannel } from "../helpers";

const channelId = "system";

export async function createNotificationChannel() {
  await createChannel({
    id: channelId,
    name: "Paramètres",
  });
}
