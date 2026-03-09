import { wp } from "~/lib/style/dp";

export default function getDefaultDrawerWidth({ height, width }) {
  const smallerAxisSize = Math.min(height, width);
  const isTablet = smallerAxisSize >= 600;
  const minWidth = isTablet ? 320 : 280;
  const responsiveWidth = isTablet ? "50%" : "43.75%";
  const dp = wp(responsiveWidth, width);
  return Math.max(Math.round(dp), minWidth);
}
