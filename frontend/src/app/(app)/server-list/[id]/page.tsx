import { ServerListEditClient } from "./server-list-edit-client";

export default async function EditServerListPage(props: PageProps<"/server-list/[id]">) {
  const { id } = await props.params;
  return <ServerListEditClient assetId={id} />;
}
