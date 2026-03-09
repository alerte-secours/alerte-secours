export default ({ onePhoneNumber: { country, number } }) =>
  [country, number].join(" ");
