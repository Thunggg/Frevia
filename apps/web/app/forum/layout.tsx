import authServerRequest from '@/apiRequests/auth.server';
import { RoleName } from '@shared/types';
import { Header, type UserRole } from '@/components/header';
import { Footer } from '@/components/footer';
import { ClientSidebar } from '@/app/(client)/_components/client-sidebar';
import { FreelancerSidebar } from '@/app/(freelancer)/_components/freelancer-sidebar';
import { ForumTheme } from './forum-theme';

async function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): Promise<UserRole> {
  if (!user) return 'GUEST';
  const primary = user.roles.find((r) => r.isPrimary) ?? user.roles[0];
  if (primary?.name === RoleName.CLIENT) return 'CLIENT';
  if (primary?.name === RoleName.FREELANCER) return 'FREELANCER';
  return 'STAFF';
}

export default async function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await authServerRequest.getMe();
  const role = await resolveHeaderRole(user);

  // Guest & Admin/Staff: public site header/footer (khong dung Client/Freelancer sidebar)
  if (role === 'GUEST' || role === 'STAFF') {
    return (
      <div className="flex min-h-dvh flex-col bg-background font-sans">
        <ForumTheme />
        <Header role={role} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // Logged-in: dashboard shell like find-work (sidebar + scrollable content)
  const Sidebar = role === 'FREELANCER' ? FreelancerSidebar : ClientSidebar;
  return (
    <>
      <style>{`html, body { overflow: hidden; }`}</style>
      <ForumTheme />
      <div className="flex h-dvh overflow-hidden bg-background font-sans">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
