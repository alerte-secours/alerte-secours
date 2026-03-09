import Text from "~/components/Text";

export default function ErrorMessageNotRelative({
  title = "Ce numéro n'est pas paramétré par son détenteur pour pouvoir être utilisé par ses proches",
}) {
  return <Text style={{ top: 5, fontSize: 16 }}>{title}</Text>;
}
