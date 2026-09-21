import { ContractEditClient } from "./contract-edit-client";

export default async function EditContractPage(props: PageProps<"/contracts/[id]">) {
  const { id } = await props.params;
  return <ContractEditClient contractId={id} />;
}
