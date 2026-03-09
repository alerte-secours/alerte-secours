import { View } from "react-native";

import Text from "~/components/Text";

import FromContactActiveRow from "./FromContactActiveRow";

import useStylesCommon from "./styles";

export default function FromContactActiveList({ data }) {
  const { manyRelativeAsTo } = data.selectOneUser;
  const commonStyles = useStylesCommon();

  const activesList = manyRelativeAsTo.filter(
    ({ oneRelativeAllow }) => oneRelativeAllow.allowed === true,
  );

  return (
    <>
      {activesList.length > 0 && (
        <View>
          <View style={commonStyles.subtitleContainer}>
            <Text style={commonStyles.subtitleText}>Actifs</Text>
          </View>
          <View>
            {activesList.map((row, index) => (
              <FromContactActiveRow key={index} oneRelativeAsTo={row} />
            ))}
          </View>
        </View>
      )}
    </>
  );
}
