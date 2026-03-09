import { gql, useLazyQuery } from "@apollo/client";
import Base62Str from "base62str";
import sha256 from "hash.js/lib/hash/sha/256";
import hmac from "hash.js/lib/hash/hmac";
import sendSMS from "~/lib/sms/sendSMS";
import { useSessionState } from "~/stores";

const base62 = Base62Str.createInstance();

async function generateCode(userId, signKey, type) {
  const timestampInSeconds = Math.floor(Date.now() / 1000);
  const signature = hmac(sha256, signKey)
    .update(`${userId}.${timestampInSeconds}`)
    .digest("hex");
  return (
    "AS_" +
    type +
    "_" +
    base62.encodeStr(`${userId}.${timestampInSeconds}#${signature}`)
  );
}

const GET_GENERATE_CODE_REQUIREMENTS = gql`
  query getGenerateCodeRequirements($userId: Int!) {
    selectManyAuthSignKey(where: { userId: { _eq: $userId } }) {
      key
    }
    selectOneExternalPublicConfig(key: smsVerificationNumber) {
      value
    }
  }
`;

export default function useSendAuthSMS() {
  const [getGenerateCodeRequirements] = useLazyQuery(
    GET_GENERATE_CODE_REQUIREMENTS,
  );
  const { userId } = useSessionState(["userId"]);

  return async ({ body, smsType }) => {
    const { data } = await getGenerateCodeRequirements({
      variables: {
        userId,
      },
    });
    const verificationNumber = data.selectOneExternalPublicConfig.value;
    const signKey = data.selectManyAuthSignKey[0].key;
    const code = await generateCode(userId, signKey, smsType);
    sendSMS([verificationNumber], body.replace(/\[CODE\]/g, code));
  };
}
