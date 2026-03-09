import getTimeDisplay from "~/utils/time/getTimeDisplay";
import useNow from "~/hooks/useNow";

export default function useTimeDisplay(date, options) {
  const now = useNow();
  return getTimeDisplay(date, now, options);
}
