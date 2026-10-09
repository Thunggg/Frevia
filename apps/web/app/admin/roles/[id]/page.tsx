import { notFound } from "next/navigation";
import { RoleDetail } from "./role-detail";

export default async function AdminRoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roleId = Number(id);

  if (!Number.isInteger(roleId) || roleId <= 0) {
    notFound();
  }

  return <RoleDetail roleId={roleId} />;
}
