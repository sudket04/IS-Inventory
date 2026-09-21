import { InternetPolicyEditClient } from "./internet-policy-edit-client";

export default async function EditInternetPolicyPage(props: PageProps<"/internet-policies/[id]">) {
  const { id } = await props.params;
  return <InternetPolicyEditClient policyId={id} />;
}
