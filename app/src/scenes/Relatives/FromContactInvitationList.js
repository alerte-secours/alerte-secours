import React, { useState, useRef, useEffect, useMemo } from "react";

import { View } from "react-native";

import Text from "~/components/Text";

import FromContactInvitationRow from "./FromContactInvitationRow";
import useStylesCommon from "./styles";

export default function FromContactInvitationList({ data }) {
  const { manyRelativeInvitation } = data.selectOneUser;
  const commonStyles = useStylesCommon();

  return (
    <>
      {manyRelativeInvitation.length > 0 && (
        <View>
          <View style={commonStyles.subtitleContainer}>
            <Text style={commonStyles.subtitleText}>
              Propositions envoyées en attente
            </Text>
          </View>
          <View>
            {manyRelativeInvitation.map((row, index) => {
              const {
                oneUserPhoneNumberRelativeAsTo: { onePhoneNumber },
              } = row;
              return (
                <FromContactInvitationRow
                  key={index}
                  id={row.id}
                  phoneNumber={onePhoneNumber.number}
                  phoneCountry={onePhoneNumber.country}
                />
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}
