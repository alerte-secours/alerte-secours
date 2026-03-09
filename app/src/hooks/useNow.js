import { useContext } from "react";
import { NowContext } from "~/components/NowProvider";

export default function useNow() {
  const now = useContext(NowContext);
  return now;
}
