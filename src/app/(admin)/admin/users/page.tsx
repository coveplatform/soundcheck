import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 100;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string }>;
}) {
  const { q: query, page: pageParam, role: roleParam } = await searchParams;
  const q = typeof query === "string" ? query.trim() : "";
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const role = roleParam || "";

  // Build where clause
  const whereClause: any = {};

  if (q) {
    whereClause.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  if (role === "artist") {
    whereClause.isArtist = true;
  } else if (role === "reviewer") {
    whereClause.isReviewer = true;
  } else if (role === "none") {
    whereClause.isArtist = false;
    whereClause.isReviewer = false;
  }

  // Get total count
  const totalUsers = await prisma.user.count({ where: whereClause });
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      isArtist: true,
      isReviewer: true,
      createdAt: true,
      listenerProfile: {
        select: {
          completedOnboarding: true,
          onboardingQuizPassed: true,
        },
      },
    },
  });

  // Build URL helper
  const buildUrl = (params: { page?: number; q?: string; role?: string }) => {
    const url = new URLSearchParams();
    if (params.q ?? q) url.set("q", params.q ?? q);
    if (params.role ?? role) url.set("role", params.role ?? role);
    if ((params.page ?? page) > 1) url.set("page", String(params.page ?? page));
    return `/admin/users${url.toString() ? `?${url.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-neutral-500">
          {totalUsers} total users {q && `matching "${q}"`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <form className="flex gap-2 flex-1 min-w-[200px]" action="/admin/users" method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search email or name"
            className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
          />
          {role && <input type="hidden" name="role" value={role} />}
          <button
            type="submit"
            className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-900 text-white"
          >
            Search
          </button>
        </form>

        <div className="flex gap-1">
          <Link
            href={buildUrl({ role: "", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              !role ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            All
          </Link>
          <Link
            href={buildUrl({ role: "artist", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              role === "artist" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Artists
          </Link>
          <Link
            href={buildUrl({ role: "reviewer", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              role === "reviewer" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Reviewers
          </Link>
          <Link
            href={buildUrl({ role: "none", page: 1 })}
            className={`h-9 px-3 rounded-md text-sm font-medium flex items-center ${
              role === "none" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            No Role
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Email</th>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Verified</th>
                <th className="text-left font-medium px-4 py-3">Roles</th>
                <th className="text-left font-medium px-4 py-3">Reviewer Status</th>
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
                    <span className={u.emailVerified ? "text-green-600" : "text-red-500"}>
                      {u.emailVerified ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isArtist && u.isReviewer
                      ? "Artist, Reviewer"
                      : u.isArtist
                      ? "Artist"
                      : u.isReviewer
                      ? "Reviewer"
                      : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {u.isReviewer ? (
                      u.listenerProfile?.completedOnboarding && u.listenerProfile?.onboardingQuizPassed ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-orange-500">Onboarding</span>
                      )
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalUsers)} of {totalUsers}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link
                href={buildUrl({ page: page - 1 })}
                className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 flex items-center"
              >
                Previous
              </Link>
            )}

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Link
                  key={pageNum}
                  href={buildUrl({ page: pageNum })}
                  className={`h-9 w-9 rounded-md text-sm font-medium flex items-center justify-center ${
                    pageNum === page
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}

            {page < totalPages && (
              <Link
                href={buildUrl({ page: page + 1 })}
                className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 flex items-center"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
