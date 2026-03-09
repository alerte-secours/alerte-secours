export default function prioritizeFeatures(features) {
  return features
    .filter(({ properties }) => !properties.isUserLocation)
    .sort(({ properties: x }, { properties: y }) => {
      // if both cluster priority is given to higher level
      if (x.cluster && y.cluster) {
        return x.x_max_level_num < y.x_max_level_num ? 1 : -1;
      }
      // if one is cluster, and the other is not, priority is given to cluster
      if (!x.cluster && y.cluster) {
        return 1;
      }
      if (x.cluster && !y.cluster) {
        return -1;
      }
      // if both are alerts priority is given to the most recent
      if (x.alert && y.alert) {
        return new Date(x.alert.createdAt) < new Date(y.alert.createdAt)
          ? 1
          : -1;
      }
    });
}
