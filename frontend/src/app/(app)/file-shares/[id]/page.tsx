import { FileShareEditClient } from "./file-share-edit-client";

export default async function EditFileSharePage(props: PageProps<"/file-shares/[id]">) {
  const { id } = await props.params;
  return <FileShareEditClient shareId={id} />;
}
