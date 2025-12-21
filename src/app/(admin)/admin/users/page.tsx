import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      isArtist: true,
      isReviewer: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-neutral-500">Most recent users (up to 50)</p>
      </div>

      <form className="flex gap-2" action="/admin/users" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search email or name"
          className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
        />
        <button
          type="submit"
          className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-900 text-white"
        >
          Search
        </button>
      </form>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Email</th>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Verified</th>
                <th className="text-left font-medium px-4 py-3">Roles</th>
                <th className="text-left font-medium px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.id} className="text-neutral-700">
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/admin/users/${u.id}`}>
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{u.name ?? ""}</td>
                  <td className="px-4 py-3">
                    {u.emailVerified ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    {u.isArtist && u.isReviewer
                      ? "Artist, Reviewer"
                      : u.isArtist
                      ? "Artist"
                      : u.isReviewer
                      ? "Reviewer"
                      : ""}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
