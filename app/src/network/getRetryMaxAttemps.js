const maxAttemptsCritical = Infinity;
const maxAttemptsMedium = 10;
// const maxAttemptsLow = 2;

const priorityMaxAttemptsByOperationName = {
  alertingSubscription: maxAttemptsCritical,
  selectStreamMessageSubscription: maxAttemptsCritical,
  connectAlertMutation: maxAttemptsCritical,
  registerUser: maxAttemptsCritical,
  loginUserToken: maxAttemptsCritical,
  storeFcmToken: maxAttemptsCritical,
  comingHelp: maxAttemptsCritical,
  insertOneMessage: maxAttemptsCritical,
  keepOpenAlert: maxAttemptsCritical,
  reOpenAlert: maxAttemptsCritical,
  notifyAround: maxAttemptsCritical,
  notifyRelatives: maxAttemptsCritical,
  sendAlert: maxAttemptsCritical,
};

export default function (operation) {
  const { operationName } = operation;
  const maxAttempts =
    priorityMaxAttemptsByOperationName[operationName] || maxAttemptsMedium;
  return maxAttempts;
}
