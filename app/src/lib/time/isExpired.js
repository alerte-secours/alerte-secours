export default function isExpired(exp) {
  return Date.now() >= exp * 1000;
}
