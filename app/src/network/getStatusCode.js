export default function getStatusCode({ networkError, graphQLErrors }) {
  if (networkError?.graphQLErrors) {
    graphQLErrors = networkError.graphQLErrors;
    networkError = null;
  }
  if (networkError) {
    return networkError.statusCode || 0;
  }
  if (graphQLErrors) {
    let code;
    for (const err of graphQLErrors) {
      if (err.extensions?.http) {
        code = err.extensions.http;
        break;
      }
      if (err.extensions?.statusCode) {
        code = err.extensions.statusCode;
        break;
      }
      if (err.extensions?.code) {
        code = err.extensions.code;
        break;
      }
    }
    // console.log({ code });
    switch (code) {
      case "validation-failed":
      case "constraint-violation":
      case "not-supported":
        return 422;
      case "remote-schema-error":
      case "INTERNAL_SERVER_ERROR":
        return 500;
      case "invalid-jwt":
      case "UNAUTHENTICATED":
        return 401;
      default:
        if (typeof code !== "number") {
          code = parseInt(code, 10);
        }
        if (isNaN(code)) {
          code = 400;
        }
        return code;
    }
  }
}
