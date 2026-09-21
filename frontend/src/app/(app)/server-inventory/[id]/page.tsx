import { ServerInventoryEditClient } from "./server-inventory-edit-client";

export default async function EditServerInventoryPage(props: PageProps<"/server-inventory/[id]">) {
  const { id } = await props.params;
  return <ServerInventoryEditClient assetId={id} />;
}
