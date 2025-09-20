import { getLists, getCategories } from "@/app/_server/actions/data/actions";
import {
  getDocs,
  getDocsCategories,
} from "@/app/_server/actions/data/notes-actions";
import { HomeClient } from "@/app/_components/features/home/HomeClient";
import { isAdmin, getUsername } from "@/app/_server/actions/auth/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [listsResult, categoriesResult, docsResult, docsCategoriesResult] =
    await Promise.all([
      getLists(),
      getCategories(),
      getDocs(),
      getDocsCategories(),
    ]);

  const lists = listsResult.success && listsResult.data ? listsResult.data : [];
  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : [];
  const docs = docsResult.success && docsResult.data ? docsResult.data : [];
  const docsCategories =
    docsCategoriesResult.success && docsCategoriesResult.data
      ? docsCategoriesResult.data
      : [];
  const admin = await isAdmin();
  const username = await getUsername();

  return (
    <HomeClient
      initialLists={lists}
      initialCategories={categories}
      initialDocs={docs}
      initialDocsCategories={docsCategories}
      isAdmin={admin}
      username={username}
    />
  );
}
