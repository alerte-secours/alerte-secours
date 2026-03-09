export function Switch({ test, children }) {
  const defaultResult = children.find((child) => child.props.default) || null;
  const result = children.find((child) => child.props.value === test);
  return result || defaultResult;
}

export function Case({ children }) {
  return children;
}

export default Switch;
