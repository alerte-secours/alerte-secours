// const stateLast = (x, y) => {
//   if (x.alert.state === y.alert.state) {
//     return null;
//   }
//   return x.alert.state === "open" ? -1 : 1;
// };

export const sortFunctions = {
  createdAt: function sortByCreatedAt(list, { relativeFirstEnabled } = {}) {
    list.sort(function (x, y) {
      // const stateLastValue = stateLast(x, y);
      // if (stateLastValue !== null) {
      //   return stateLastValue;
      // }
      if (relativeFirstEnabled) {
        const relativeSort = sortFunctions.relative(x, y);
        if (relativeSort !== 0) {
          return relativeSort;
        }
      }
      return new Date(x.createdAt) < new Date(y.createdAt) ? 1 : -1;
    });
  },
  location: function sortByLocation(list, { relativeFirstEnabled } = {}) {
    list.sort(function (x, y) {
      // const stateLastValue = stateLast(x, y);
      // if (stateLastValue !== null) {
      //   return stateLastValue;
      // }
      if (relativeFirstEnabled) {
        const relativeSort = sortFunctions.relative(x, y);
        if (relativeSort !== 0) {
          return relativeSort;
        }
      }
      return x.alert.distance > y.alert.distance ? 1 : -1;
    });
  },
  alphabetical: function sortByAlphabet(list, { relativeFirstEnabled } = {}) {
    list.sort(function (x, y) {
      // const stateLastValue = stateLast(x, y);
      // if (stateLastValue !== null) {
      //   return stateLastValue;
      // }
      if (relativeFirstEnabled) {
        const relativeSort = sortFunctions.relative(x, y);
        if (relativeSort !== 0) {
          return relativeSort;
        }
      }
      return x.alert.code.localeCompare(y.alert.code, "fr", {
        sensitivity: "base",
      });
    });
  },
  relative: function sortByRelative(x, y) {
    if (x.reason === "relative" && y.reason !== "relative") {
      return -1;
    }
    if (x.reason !== "relative" && y.reason === "relative") {
      return 1;
    }
    return 0;
  },
};

export const sortedByLabels = {
  location: "localisation",
  createdAt: "ancienneté",
  alphabetical: "code alphabétique",
};
