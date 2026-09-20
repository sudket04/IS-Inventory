import { AssetEditClient } from "./asset-edit-client";

export default async function EditAssetPage(props: PageProps<"/assets/[id]">) {
  const { id } = await props.params;
  return <AssetEditClient assetId={id} />;
}
