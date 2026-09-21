import { ClusterEditClient } from "./cluster-edit-client";

export default async function EditClusterPage(props: PageProps<"/clusters/[id]">) {
  const { id } = await props.params;
  return <ClusterEditClient clusterId={id} />;
}
