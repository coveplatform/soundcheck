import { redirect } from "next/navigation";

export default async function ListenerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/reviewer/review/${id}`);
}
