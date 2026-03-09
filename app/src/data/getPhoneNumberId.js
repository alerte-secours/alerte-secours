import network from "~/network";
import GET_PHONE_NUMBER_ID from "~/gql/queries/getPhoneNumberId";

export default async function getPhoneNumberId(
  [phoneCountry, phoneNumber],
  options = {},
) {
  const { data } = await network.apolloClient.query({
    query: GET_PHONE_NUMBER_ID,
    fetchPolicy: "network-only",
    variables: {
      phoneCountry,
      phoneNumber,
    },
    ...options,
  });
  return data.selectManyPhoneNumber[0]?.id;
}
