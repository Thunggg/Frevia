import { notFound } from "next/navigation";
import { PermissionDetail } from "./permission-detail";

export default async function AdminPermissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const permissionId = Number(id);

  if (!Number.isInteger(permissionId) || permissionId <= 0) {
    notFound();
  }

  return <PermissionDetail permissionId={permissionId} />;
}
