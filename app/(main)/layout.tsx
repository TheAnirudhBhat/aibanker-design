"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import TopNav from "@/app/components/TopNav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeProvider, useTheme } from "@/app/lib/theme";

// ── Navigation items per section ─────────────────────────────
const APP_ITEMS = [
  { href: "/app/new-user-jun-11", label: "Enhancements" },
  { href: "/app/new-user", label: "New user" },
  { href: "/app/returning", label: "Returning user" },
];

const PLAYGROUND_ITEMS = [
  { href: "/playground/dls", label: "DLS" },
  { href: "/playground/components", label: "Components" },
  { href: "/playground/visualizations", label: "Visualizations" },
  { href: "/playground/widgets", label: "Widgets" },
  { href: "/playground/screens", label: "Screens" },
  { href: "/playground/flows", label: "Flows" },
];

const SKILLS_ITEMS = [
  { href: "/skills", label: "Skills" },
];

// ── Breadcrumb labels ────────────────────────────────────────
const BREADCRUMB_LABELS: Record<string, string> = {
  "new-user": "New user",
  returning: "Returning user",
  "new-user-jun-11": "Enhancements",
  dls: "DLS",
  components: "Components",
  visualizations: "Visualizations",
  widgets: "Widgets",
  screens: "Screens",
  flows: "Flows",
};

function getBreadcrumb(pathname: string): { section: string; page: string } {
  const segments = pathname.split("/").filter(Boolean);
  const section = segments[0] === "app" ? "App" : segments[0] === "skills" ? "Skills" : "Playground";
  const lastSegment = segments[segments.length - 1];
  const page =
    lastSegment === "app" || lastSegment === "playground" || lastSegment === "skills"
      ? "Overview"
      : BREADCRUMB_LABELS[lastSegment] ?? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  return { section, page };
}

function DarkModeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="dls-dark-mode" className="text-xs text-muted-foreground">
        Dark mode
      </Label>
      <Switch
        id="dls-dark-mode"
        size="sm"
        checked={mode === "dark"}
        onCheckedChange={toggle}
      />
    </div>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <MainLayoutInner>{children}</MainLayoutInner>
    </ThemeProvider>
  );
}

function MainLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);
  const isApp = pathname.startsWith("/app");
  const isSkills = pathname.startsWith("/skills");
  const sidebarItems = isApp ? APP_ITEMS : isSkills ? SKILLS_ITEMS : PLAYGROUND_ITEMS;

  return (
    <div className="flex h-screen flex-col">
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider className="min-h-0">
          <Sidebar collapsible="none" className="border-r h-auto">
            <SidebarContent className="pt-2">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map(({ href, label }) => {
                      const isActive = pathname === href || pathname.startsWith(href + "/");
                      return (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link href={href}>{label}</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="min-h-0 overflow-hidden">
            {/* Breadcrumb bar */}
            <header className="flex h-12 shrink-0 items-center justify-between border-b px-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>{breadcrumb.section}</BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumb.page}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <DarkModeToggle />
            </header>

            {/* Page content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
