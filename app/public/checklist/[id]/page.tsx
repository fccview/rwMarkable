import { redirect } from "next/navigation";
import { getAllLists } from "@/app/_server/actions/data/list-queries";
import { getItemSharingMetadata } from "@/app/_server/actions/sharing/sharing-utils";
import { PublicChecklistView } from "@/app/_components/features/public/PublicChecklistView";

interface PublicChecklistPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function PublicChecklistPage({
  params,
}: PublicChecklistPageProps) {
  const { id } = params;

  const listsResult = await getAllLists();
  if (!listsResult.success || !listsResult.data) {
    redirect("/");
  }

  const checklist = listsResult.data.find((list) => list.id === id);
  if (!checklist) {
    redirect("/");
  }

  // Check if this checklist is publicly shared
  const sharingMetadata = await getItemSharingMetadata(
    id,
    "checklist",
    checklist.owner!
  );

  if (!sharingMetadata || !sharingMetadata.isPubliclyShared) {
    redirect("/");
  }

  return <PublicChecklistView checklist={checklist} />;
}
