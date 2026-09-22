import { NetworkHardwareEditClient } from "./network-hardware-edit-client";

export default async function EditNetworkHardwarePage(props: PageProps<"/network-hardware/[id]">) {
  const { id } = await props.params;
  return <NetworkHardwareEditClient assetId={id} />;
}
