export default function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Parent (dashboard)/layout.tsx already handles auth, sidebar, and layout.
  return <>{children}</>;
}
