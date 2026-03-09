import AvatarLight from "~/theme/avatar/Light";
const { colors } = AvatarLight;
export default (seed) => {
  if (typeof seed === "string") {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char; // Left shift by 5 and add the character code
      hash |= 0; // Convert to 32bit integer
    }
    seed = hash;
  }
  seed = Math.abs(seed);
  const index = seed % colors.length;
  return colors[index];
};
