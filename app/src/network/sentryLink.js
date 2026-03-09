import { SentryLink } from "apollo-link-sentry";

export default function createSentryLink() {
  return new SentryLink();
}
