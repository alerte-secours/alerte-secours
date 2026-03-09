import mapKeys from "lodash.mapkeys";
import camelCase from "lodash.camelcase";

export default function camelCaseKeys(obj) {
  return mapKeys(obj, (_value, key) => camelCase(key));
}
