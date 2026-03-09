/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from "react";
import { createWithEqualityFn as createZustandStore } from "zustand/traditional";
import { subscribeWithSelector } from "zustand/middleware";
import { shallow, useShallow } from "zustand/shallow";
import getByDotKey from "lodash.get";
import setByDotKey from "lodash.set";
import cloneDeep from "lodash.clonedeep";
import produce from "immer";
import capitalizePreservingCase from "~/utils/string/capitalizePreservingCase";

function getStateFromDefault(atomDefault) {
  return typeof atomDefault === "object" && atomDefault !== null
    ? cloneDeep(atomDefault)
    : atomDefault;
}

const getStore =
  ({ getGlobalStore }) =>
  (...args) => {
    if (args.length > 0) {
      const [storeName] = args;
      const globalState = getGlobalStore();
      return globalState[storeName];
    } else {
      return getGlobalStore();
    }
  };
const getActions =
  ({ storeRef, atomName }) =>
  (...args) => {
    if (args.length > 0) {
      const [storeName] = args;
      const { actions } = storeRef[storeName];
      return actions;
    } else {
      const { actions } = storeRef[atomName];
      return actions;
    }
  };
const get =
  ({ getStore, getGlobalStore }) =>
  (...args) => {
    if (args.length > 1) {
      const [storeName, key] = args;
      const globalState = getGlobalStore();
      const state = globalState[storeName];
      return getByDotKey(state, key);
    } else if (args.length > 0) {
      const [key] = args;
      const state = getStore();
      return getByDotKey(state, key);
    } else {
      return getStore();
    }
  };
const set =
  ({ getStore, setStore, getGlobalStore, setGlobalStore }) =>
  (...args) => {
    if (args.length > 2) {
      const [storeName, key, value] = args;
      const globalState = getGlobalStore();
      const state = globalState[storeName];
      setByDotKey(state, key, value);
      setGlobalStore({
        [storeName]: state,
      });
    } else if (args.length > 1) {
      const [key, value] = args;
      const state = getStore();
      setByDotKey(state, key, value);
      setStore(state);
    } else {
      const [state] = args;
      setStore(state);
    }
  };
const mutate =
  ({ getStore, setStore, getGlobalStore, setGlobalStore }) =>
  (...args) => {
    if (args.length > 1) {
      const [storeName, func] = args;
      const globalState = getGlobalStore();
      const state = produce(func(globalState[storeName]));
      setGlobalStore({
        [storeName]: state,
      });
    } else {
      const [func] = args;
      const state = produce(func(getStore()));
      setStore(state);
    }
  };
const merge =
  ({ getGlobalStore, getStore, setStore, setGlobalStore }) =>
  (...args) => {
    if (args.length > 1) {
      const [storeName, obj] = args;
      const globalState = getGlobalStore();
      const state = globalState[storeName];
      Object.assign(state, obj);
      setGlobalStore({
        [storeName]: state,
      });
    } else {
      const [obj] = args;
      const state = getStore();
      Object.assign(state, obj);
      setStore(state);
    }
  };
const reset =
  ({ setGlobalStore, setStore, storeRef, atomName }) =>
  (...args) => {
    if (args.length > 0) {
      const [storeName] = args;
      const { default: defaultState } = storeRef[storeName];
      const state = getStateFromDefault(defaultState);
      setGlobalStore({
        [storeName]: state,
      });
    } else {
      const { default: defaultState } = storeRef[atomName];
      const state = getStateFromDefault(defaultState);
      setStore(state);
    }
  };

const subscribe =
  ({ atomName, getUseStore }) =>
  (...args) => {
    if (typeof args[0] === "string") {
      atomName = args.shift();
    }
    const [selectorFunc, callback, options = {}] = args;
    const selector = (state) => {
      const stateAtom = getByDotKey(state, atomName);
      return selectorFunc(stateAtom);
    };
    let unsubscribe;
    setImmediate(() => {
      const useStore = getUseStore();
      unsubscribe = useStore.subscribe(selector, callback, options);
    });
    return () => {
      setTimeout(() => {
        unsubscribe && unsubscribe();
      }, 100);
    };
  };

const defaultPlugins = {
  get,
  set,
  merge,
  mutate,
  reset,
  getStore,
  getActions,
  subscribe,
};

export default createStore;

export function createStore(stores, customPlugins = {}) {
  const plugins = {
    ...defaultPlugins,
    ...customPlugins,
  };

  const storeRef = Object.entries(stores).reduce((acc, [atomName]) => {
    acc[atomName] = {
      actions: {},
    };
    return acc;
  }, {});

  const ref = {};
  const useStore = createZustandStore(
    subscribeWithSelector((setGlobalStore, getGlobalStore) =>
      Object.entries(stores).reduce((acc, [atomName, createAtomStore]) => {
        const getStore = () => getGlobalStore()[atomName];
        const setStore = (store) =>
          setGlobalStore({
            [atomName]: store,
          });
        const atomContext = {
          setGlobalStore,
          getGlobalStore,
          setStore,
          getStore,
          storeRef,
        };
        const atom = createAtomStore(atomName, atomContext, plugins, ref);
        const reg = storeRef[atomName];
        reg.default = atom.default;
        if (atom.actions) {
          Object.assign(reg.actions, atom.actions);
        }

        acc[atomName] = atom.state;
        return acc;
      }, {}),
    ),
  );
  ref.useStore = useStore;

  const funcs = Object.keys(stores).reduce((acc, atomName) => {
    Object.assign(acc, createAtomFuncs(atomName, useStore, storeRef));
    return acc;
  }, {});

  return {
    useStore,
    ...funcs,
  };
}

export function createAtom(createStore) {
  return function createAtomStore(atomName, atomContext, plugins, ref) {
    const { getStore, setStore, setGlobalStore, getGlobalStore, storeRef } =
      atomContext;
    const pluginContext = {
      atomName,
      getStore,
      setStore,
      setGlobalStore,
      getGlobalStore,
      storeRef,
      getUseStore: () => {
        return ref.useStore;
      },
    };

    const pluginMethods = Object.entries(plugins).reduce(
      (acc, [key, createPlugin]) => {
        acc[key] = createPlugin(pluginContext);
        return acc;
      },
      {},
    );

    const atomStore = createStore({
      ...pluginMethods,
    });

    const { default: atomDefault } = atomStore;
    atomStore.state = getStateFromDefault(atomDefault);

    return atomStore;
  };
}

function createAtomFuncs(atomName, useStore, storeRef) {
  const useState = (callback, deps = [], compare) => {
    if (Array.isArray(callback)) {
      const arr = callback;
      callback = (state) =>
        arr.reduce((acc, key) => {
          acc[key] = state[key];
          return acc;
        }, {});
      deps.push(...arr);
      compare = true;
    }
    compare = compare === true ? shallow : compare;
    const memoizedCallback = useCallback((state) => callback(state), deps);
    return useStore(
      useShallow((state) => memoizedCallback(state[atomName])),
      compare,
    );
  };

  const { actions } = storeRef[atomName];
  const capitalizedAtomName = capitalizePreservingCase(atomName);

  const getState = () => {
    const state = useStore.getState();
    return state[atomName];
  };

  const subscribeState = (check, func, compare) => {
    if (compare === true) {
      compare = shallow;
    }
    if (check) {
      const providedCheck = check;
      check = (state) => providedCheck(state[atomName]);
    }
    return useStore.subscribe(check, func, compare);
  };

  return {
    [`${atomName}Actions`]: actions,
    [`use${capitalizedAtomName}State`]: useState,
    [`get${capitalizedAtomName}State`]: getState,
    [`subscribe${capitalizedAtomName}State`]: subscribeState,
  };
}
