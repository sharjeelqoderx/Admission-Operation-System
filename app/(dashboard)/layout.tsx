'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/shared/sidebar';
import { SidebarItem } from '@/components/shared/sidebar-item';
import { SidebarGroup } from '@/components/shared/sidebar-group';
import { Navbar } from '@/components/shared/navbar';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/shared/page-loader';
import {
  LayoutGrid,
  Users2,
  FileText,
  Settings,
  BookOpen,
  MessageSquare,
  BarChart3,
  Award,
  Wallet,
  Folder,
  UserCircle,
  Building,
  UserPlus,
  Eye,
  // FileUp,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export enum Role {
  UNIVERSITY = 'UNIVERSITY',
  STUDENT = 'STUDENT',
  AGENT = 'AGENT',
}

const sidebarRoutes = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
    allowFor: [Role.UNIVERSITY, Role.STUDENT, Role.AGENT],
  },

  {
    label: 'All Students',
    icon: Users2,
    allowFor: [Role.UNIVERSITY, Role.AGENT],
    children: [
      {
        label: 'Add Student',
        href: '/dashboard/student/new',
        icon: UserPlus,
        allowFor: [Role.AGENT],
      },
      {
        label: 'View Student',
        href: '/dashboard/student',
        icon: Eye,
        allowFor: [Role.AGENT],
      },
    ],
  },

  {
    label: 'All Applications',
    href: '/dashboard/application',
    icon: FileText,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Programs',
    href: '/dashboard/program',
    icon: BarChart3,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'All Documents',
    icon: Folder,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
    children: [
      // {
      //   label: 'Upload Document',
      //   href: '/dashboard/document/new',
      //   icon: FileUp,
      //   allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
      // },
      {
        label: 'View Documents',
        href: '/dashboard/document',
        icon: Eye,
        allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
      },
    ],
  },

  {
    label: 'Offers',
    href: '/dashboard/offer',
    icon: Award,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Payments',
    href: '/dashboard/payment',
    icon: Wallet,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Commissions',
    href: '/dashboard/commission',
    icon: BarChart3,
    allowFor: [Role.AGENT],
  },

  {
    label: 'Messages',
    href: '/dashboard/chat',
    icon: MessageSquare,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Agent Profile',
    href: '/dashboard/profile',
    icon: UserCircle,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },
];

function filterByRole(routes: any[], role: Role) {
  return routes
    .map(route => {
      if (!route.allowFor.includes(role)) return null;

      if (route.children) {
        const children = route.children.filter((c: any) =>
          c.allowFor.includes(role)
        );

        if (children.length === 0) return null;

        return { ...route, children };
      }

      return route;
    })
    .filter(Boolean);
}

/**
 * ✅ STRICT ACTIVE MATCH
 * Only exact route match is considered active
 */
function isRouteActive(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href;
}

/**
 * ✅ Group active if ANY child is active
 */
function isGroupActive(pathname: string, children?: any[]) {
  if (!children) return false;
  return children.some(c => isRouteActive(pathname, c.href));
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { me } = useAuth();
  const { data: currentUser, isLoading, status } = me;

  const handleCloseSidebar = () => setSidebarOpen(false);

  if (isLoading || status === 'pending') {
    return <PageLoader label="Loading dashboard..." />;
  }

  const role = (currentUser?.role as Role) ?? Role.STUDENT;
  const routes = filterByRole(sidebarRoutes, role);

  return (
    <div className="flex h-screen bg-transparent app-bg">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleCloseSidebar}
        />
      )}

      <Sidebar isOpen={sidebarOpen}>
        {routes.map((route: any) => {
          const Icon = route.icon;

          // 🔹 GROUP
          if (route.children?.length) {
            const groupActive = isGroupActive(pathname, route.children);

            return (
              <SidebarGroup
                key={route.label}
                icon={Icon ? <Icon className="w-5 h-5" /> : null}
                label={route.label}
                defaultOpen={groupActive}
              >
                {route.children.map((child: any) => {
                  const ChildIcon = child.icon;
                  const active = isRouteActive(pathname, child.href);

                  return (
                    <SidebarItem
                      key={child.href}
                      href={child.href}
                      icon={<ChildIcon className="w-5 h-5" />}
                      label={child.label}
                      isActive={active}
                      isChild={true}
                    />
                  );
                })}
              </SidebarGroup>
            );
          }

          // 🔹 SINGLE ITEM
          return (
            <SidebarItem
              key={route.href}
              href={route.href}
              icon={<Icon className="w-5 h-5" />}
              label={route.label === 'Agent Profile' && role === Role.STUDENT ? 'Student Profile' : route.label}
              isActive={isRouteActive(pathname, route.href)}
            />
          );
        })}
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          userName={currentUser?.fullName ?? 'John Doe'}
          userRole={currentUser?.role ?? 'STUDENT'}
          userImage={currentUser?.avatarUrl ?? undefined}

          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-y-auto relative">
          {/* Fixed Background Layer */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: "#faf8ff",
                // backgroundImage: 'url("/bg-pattern.png")',
                // backgroundSize: 'cover',
                // backgroundPosition: 'center',
              }}
            />
          </div>

          {/* Page Content */}
          <div className="relative z-10 p-4 sm:p-6 max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}