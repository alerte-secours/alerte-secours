import { useContext } from "react";
import ToastContext from "./context";

export default function useToast() {
  return useContext(ToastContext);
}
