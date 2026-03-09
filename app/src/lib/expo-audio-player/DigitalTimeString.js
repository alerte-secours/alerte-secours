import React from "react";
import { Text } from "react-native";
import useStyles from "./styles";

const str_pad_left = (string, pad, length) => {
  return (new Array(length + 1).join(pad) + string).slice(-length);
};

const convertNumberToTime = (total_milli_seconds) => {
  if (total_milli_seconds < 0) {
    return "00:00";
  }
  let total_seconds = total_milli_seconds / 1000;
  total_seconds = Number(total_seconds.toFixed(0));

  let hours = Math.floor(total_seconds / 3600);
  let seconds_left = total_seconds - hours * 3600;
  let minutes = Math.floor(seconds_left / 60);
  let seconds = seconds_left - minutes * 60;

  let finalTime =
    (hours > 0 ? str_pad_left(hours, "0", 2) + ":" : "") +
    str_pad_left(minutes, "0", 2) +
    ":" +
    str_pad_left(seconds, "0", 2);
  return finalTime;
};

const DigitalTimeString = ({ time, style }) => {
  const displayTime = convertNumberToTime(time);
  const styles = useStyles();
  return (
    <Text style={[styles.standardText, style.standardText]}>{displayTime}</Text>
  );
};

export default DigitalTimeString;
