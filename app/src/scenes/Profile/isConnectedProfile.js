export default function isConnectedProfile(profileData) {
  return (
    profileData.selectOneUser.manyEmail[0]?.email ||
    profileData.selectOneUser.manyPhoneNumber.length > 0
  );
}
