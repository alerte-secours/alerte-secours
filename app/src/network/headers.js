import env from "~/env";

function setBearerHeaderAuthorization(headers, userToken) {
  // console.log("userToken", userToken);
  headers["Authorization"] = "Bearer " + userToken;
  return headers;
}
function setBearerHeaderCookie(headers, userToken) {
  headers["Cookie"] = `${env.BEARER_COOKIE_NAME}=${userToken}`;
  return headers;
}
export const setBearerHeader = env.BEARER_USE_COOKIE
  ? setBearerHeaderCookie
  : setBearerHeaderAuthorization;

function hasBearerHeaderAuthorization(headers) {
  return !!headers["Authorization"];
}
function hasBearerHeaderCookie(headers) {
  return !!headers["Cookie"];
}

export const hasBearerHeader = env.BEARER_USE_COOKIE
  ? hasBearerHeaderCookie
  : hasBearerHeaderAuthorization;
