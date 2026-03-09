import { ApolloLink, Observable } from "@apollo/client";

export default class AutoCancelLink extends ApolloLink {
  constructor() {
    super();
    this.pendingOperations = {};
  }

  request(operation, forward) {
    const key = this._operationKey(operation);
    const controller = new AbortController();

    // Check if there's an ongoing operation with the same key
    if (this.pendingOperations[key]) {
      // Cancel the previous operation
      this.pendingOperations[key].abort();
    }

    // Update the registry with the new operation's controller
    this.pendingOperations[key] = controller;

    // Attach the AbortController's signal to the operation's context
    operation.setContext({
      fetchOptions: {
        signal: controller.signal,
      },
    });

    return new Observable((observer) => {
      const handle = forward(operation).subscribe({
        next: observer.next.bind(observer),
        error: observer.error.bind(observer),
        complete: () => {
          observer.complete.bind(observer)();
          // Remove the operation from the registry once it completes
          delete this.pendingOperations[key];
        },
      });

      // Cleanup the operation from the registry if the consumer unsubscribes
      return () => {
        handle.unsubscribe();
        delete this.pendingOperations[key];
      };
    });
  }

  _operationKey(operation) {
    const { operationName, variables } = operation;
    const variablesKey = JSON.stringify(variables);
    return `${operationName}-${variablesKey}`;
  }
}
