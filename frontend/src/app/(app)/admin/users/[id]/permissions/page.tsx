import { UserPermissionsClient } from "./user-permissions-client";

export default async function UserPermissionsPage(props: PageProps<"/admin/users/[id]/permissions">) {
  const { id } = await props.params;
  return <UserPermissionsClient userId={id} />;
}
