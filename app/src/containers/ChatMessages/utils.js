export const getVisibleIndexes = (
  { layoutMeasurement, contentOffset, contentSize },
  itemLayouts,
) => {
  const visibleTop = contentOffset.y;
  const visibleBottom = visibleTop + layoutMeasurement.height;

  const visibleIndexes = itemLayouts
    .map((layout, index) => ({ layout, index }))
    .filter(({ layout }) => {
      if (!layout) return false;
      const itemTop = layout.y;
      const itemBottom = itemTop + layout.height;
      // Message must be at least 30% visible to count as viewed
      const visibleHeight =
        Math.min(itemBottom, visibleBottom) - Math.max(itemTop, visibleTop);
      const isVisible = visibleHeight > layout.height * 0.3;
      return isVisible;
    })
    .map(({ index }) => index);

  return visibleIndexes;
};

export const isScrollAtBottom = ({
  layoutMeasurement,
  contentOffset,
  contentSize,
}) => {
  const paddingToBottom = 20;
  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
};
