import { redirect } from "next/navigation";
import {
  getDocs,
  getDocsCategories,
  getAllDocs,
} from "@/app/_server/actions/data/notes-actions";
import { isAdmin, getUsername } from "@/app/_server/actions/auth/utils";
import { NoteClient } from "@/app/_components/features/notes/NoteClient";

interface NotePageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: NotePageProps) {
  const { id } = params;
  const username = await getUsername();
  const isAdminUser = await isAdmin();

  const [docsResult, docsCategoriesResult] = await Promise.all([
    getDocs(username),
    getDocsCategories(),
  ]);

  if (!docsResult.success || !docsResult.data) {
    redirect("/");
  }

  let note = docsResult.data.find((doc) => doc.id === id);

  if (!note && isAdminUser) {
    const allDocsResult = await getAllDocs();
    if (allDocsResult.success && allDocsResult.data) {
      note = allDocsResult.data.find((doc) => doc.id === id);
    }
  }

  if (!note) {
    redirect("/");
  }

  const docsCategories =
    docsCategoriesResult.success && docsCategoriesResult.data
      ? docsCategoriesResult.data
      : [];

  return (
    <NoteClient
      note={note}
      docs={docsResult.data}
      categories={docsCategories}
      username={username}
      isAdmin={isAdminUser}
    />
  );
}
