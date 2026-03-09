const castIntVars = ["deviceId", "userId"];
export default function sessionVarsFromClaims(claims) {
  const session = { ...claims };
  for (const castIntVar of castIntVars) {
    session[castIntVar] = parseInt(session[castIntVar], 10);
  }
  return session;
}
