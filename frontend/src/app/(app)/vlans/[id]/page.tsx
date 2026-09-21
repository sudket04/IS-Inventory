import { VlanEditClient } from "./vlan-edit-client";

export default async function EditVlanPage(props: PageProps<"/vlans/[id]">) {
  const { id } = await props.params;
  return <VlanEditClient vlanId={id} />;
}
