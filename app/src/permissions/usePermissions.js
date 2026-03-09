// import usePermissionLocationBackground from "~/permissions/usePermissionLocationBackground";
import usePermissionLocationForeground from "~/permissions/usePermissionLocationForeground";
import usePermissionFcm from "~/permissions/usePermissionFcm";
import usePermissionPhoneCall from "~/permissions/usePermissionPhoneCall";

export default function usePermissions() {
  // usePermissionLocationBackground();
  usePermissionLocationForeground();
  usePermissionFcm();
  usePermissionPhoneCall();
}
