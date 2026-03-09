import { createContext, useContext } from "react";

export const RootNavCtx = createContext();
export function useRootNav() {
  return useContext(RootNavCtx);
}

export const DrawerStateCtx = createContext();
export function useDrawerState() {
  return useContext(DrawerStateCtx);
}

export const LayoutKeyCtx = createContext();
export function useLayoutKey() {
  return useContext(LayoutKeyCtx);
}
