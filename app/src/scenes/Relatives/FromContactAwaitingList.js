import { View } from "react-native";

import Text from "~/components/Text";

import FromContactAwaitingRow from "./FromContactAwaitingRow";

import useStylesCommon from "./styles";

export default function FromContactAwaitingList({ data }) {
  const commonStyles = useStylesCommon();
  const { manyRelativeAsTo } = data.selectOneUser;

  const awaitingAllowList = manyRelativeAsTo.filter(
    ({ oneRelativeAllow }) => oneRelativeAllow.allowed === null,
  );

  return (
    <>
      {awaitingAllowList.length > 0 && (
        <View>
          <View style={commonStyles.subtitleContainer}>
            <Text style={commonStyles.subtitleText}>
              Demandes reçues en attente
            </Text>
          </View>
          <View>
            {awaitingAllowList.map((row, index) => (
              <FromContactAwaitingRow key={index} oneRelativeAsTo={row} />
            ))}
          </View>
        </View>
      )}
    </>
  );
}
