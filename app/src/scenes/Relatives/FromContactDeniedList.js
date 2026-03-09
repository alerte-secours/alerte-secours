import React, { useState, useRef, useEffect, useMemo } from "react";

import { View } from "react-native";

import Text from "~/components/Text";

import FromContactDeniedRow from "./FromContactDeniedRow";

import useStylesCommon from "./styles";

export default function FromContactDeniedList({ data }) {
  const { manyRelativeAsTo } = data.selectOneUser;
  const deniedList = manyRelativeAsTo.filter(
    ({ oneRelativeAllow }) => oneRelativeAllow.allowed === false,
  );

  const commonStyles = useStylesCommon();

  return (
    <>
      {deniedList.length > 0 && (
        <View>
          <View style={commonStyles.subtitleContainer}>
            <Text style={commonStyles.subtitleText}>Refusés</Text>
          </View>
          <View>
            {deniedList.map((row, index) => (
              <FromContactDeniedRow
                key={index}
                type={"denied"}
                oneRelativeAsTo={row}
              />
            ))}
          </View>
        </View>
      )}
    </>
  );
}
