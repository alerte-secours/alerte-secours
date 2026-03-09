import React, { createContext, useContext, useRef } from "react";
const AudioContext = createContext();

export function useAudio() {
  return useContext(AudioContext);
}

export const AudioProvider = ({ children }) => {
  const playerObjects = useRef([]);
  const register = (player) => {
    playerObjects.current.push(player);
  };
  const unregister = (player) => {
    playerObjects.current = playerObjects.current.filter((p) => p !== player);
  };
  const getAll = () => {
    return playerObjects.current;
  };
  return (
    <AudioContext.Provider value={{ register, unregister, getAll }}>
      {children}
    </AudioContext.Provider>
  );
};
