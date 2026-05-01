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
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

import { DollarSign, Building, Folder } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export enum Role {
  UNIVERSITY = 'UNIVERSITY',
  STUDENT = 'STUDENT',
  AGENT = 'AGENT',
}

export const sidebarRoutes = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowFor: [Role.UNIVERSITY, Role.STUDENT, Role.AGENT],
  },

  {
    label: 'Students',
    icon: Users,
    allowFor: [Role.UNIVERSITY, Role.AGENT],
    children: [
      {
        label: 'All Students',
        href: '/dashboard/student',
        icon: Users,
        allowFor: [Role.UNIVERSITY, Role.AGENT],
      },
      {
        label: 'Add Student',
        href: '/dashboard/student/new',
        icon: Users,
        allowFor: [Role.AGENT],
      },
    ],
  },

  {
    label: 'Applications',
    href: '/dashboard/applications',
    icon: FileText,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Programs',
    href: '/dashboard/programs',
    icon: BookOpen,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Campus',
    href: '/dashboard/campus',
    icon: Building,
    allowFor: [Role.UNIVERSITY],
  },

  {
    label: 'Payments',
    href: '/dashboard/payments',
    icon: DollarSign,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Commissions',
    href: '/dashboard/commissions',
    icon: DollarSign,
    allowFor: [Role.AGENT],
  },

  {
    label: 'Documents',
    href: '/dashboard/documents',
    icon: Folder,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Offers',
    href: '/dashboard/offers',
    icon: FileText,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    allowFor: [Role.UNIVERSITY, Role.AGENT, Role.STUDENT],
  },

  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: Settings,
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
    <div className="flex h-screen bg-transparent">
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
              label={route.label}
              isActive={isRouteActive(pathname, route.href)}
            />
          );
        })}
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          userName={currentUser?.fullName ?? 'John Doe'}
          userRole={currentUser?.role ?? 'STUDENT'}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#eef4ff] relative">
          {children}
        </main>
      </div>
    </div>
  );
}