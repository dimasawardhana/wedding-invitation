import AuthGuard from "@/components/auth/AuthGuard";
import InvitationList from "@/components/dashboard/InvitationList";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <InvitationList />
    </AuthGuard>
  );
}
