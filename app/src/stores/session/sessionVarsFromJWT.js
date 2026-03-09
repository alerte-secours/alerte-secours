import getHasuraClaimsFromJWT from "~/utils/jwt/getHasuraClaimsFromJwt";

import env from "~/env";

import sessionVarsFromClaims from "./sessionVarsFromClaims";

export default function sessionVarsFromJWT(jwt) {
  if (!jwt) {
    return {};
  }

  const claims = getHasuraClaimsFromJWT(jwt, env.CLAIMS_NAMESPACE);

  const session = sessionVarsFromClaims(claims);

  return session;
}
