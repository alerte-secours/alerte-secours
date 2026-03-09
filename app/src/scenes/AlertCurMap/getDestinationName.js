export default (route) => {
  if (!route) {
    return;
  }
  const { legs } = route;
  const lastLeg = legs[legs.length - 1];
  if (!lastLeg) {
    return;
  }
  const { steps } = lastLeg;
  const lastStep = steps[steps.length - 1];
  if (!lastStep) {
    return;
  }
  return lastStep.name;
};
