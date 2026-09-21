import { RackEditClient } from "./rack-edit-client";

export default async function EditRackPage(props: PageProps<"/racks/[id]">) {
  const { id } = await props.params;
  return <RackEditClient rackId={id} />;
}
