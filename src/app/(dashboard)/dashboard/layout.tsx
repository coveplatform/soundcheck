import { AudioProvider } from "@/components/dashboard/audio-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AudioProvider>{children}</AudioProvider>;
}
