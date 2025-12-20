"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthButtons } from "./auth-buttons";
import { Button } from "@/components/ui/button";
import { Database, Save, Settings, BarChart2, Key, Layers, Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [tooltipTarget, setTooltipTarget] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Generator", href: "/generator", icon: <Database className="h-4 w-4" /> },
    { name: "Templates", href: "/templates", icon: <Layers className="h-4 w-4" /> },
    { name: "Saved", href: "/saved", icon: <Save className="h-4 w-4" />, requiresAuth: true },
    { name: "AI Settings", href: "/settings", icon: <Settings className="h-4 w-4" />, requiresAuth: true },
    { name: "API", href: "/api-keys", icon: <Key className="h-4 w-4" />, requiresAuth: true },
  ];

  if (session?.user) {
    navItems.push({
      name: "Log",
      href: "/dashboard/events",
      icon: <BarChart2 className="h-4 w-4" />,
    });
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/80 shadow-2xl shadow-slate-950/60 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div>
            <Database className="h-8 w-8" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-wide text-white">MockRG.AI</div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Data Mocker</p>
          </div>
        </Link>

        <TooltipProvider>
          <nav className="hidden flex-1 flex-wrap items-center justify-end gap-2 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const isDisabled = !!(item.requiresAuth && !session?.user);

              if (isDisabled) {
                return (
                  <Tooltip
                    key={item.href}
                    open={tooltipTarget === item.href}
                    onOpenChange={(open) => setTooltipTarget(open ? item.href : null)}
                  >
                    <TooltipTrigger asChild>
                      <span
                        onClick={() => setTooltipTarget(item.href)}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground opacity-60 cursor-pointer"
                      >
                        {item.icon}
                        {item.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Sign in to access</TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className={`rounded-full px-3 text-xs font-semibold tracking-wide uppercase nav-cta-button transition duration-150 ease-in-out hover:-translate-y-0.5 hover:ring-1 hover:ring-slate-200/40 active:scale-95`}
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    {item.icon}
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </TooltipProvider>

        <div className="ml-auto hidden md:block">
          <AuthButtons />
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-white/10 bg-slate-900/70 text-white hover:bg-slate-800/80"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-2 text-white shadow-2xl shadow-slate-950/70 backdrop-blur-xl"
            >
              <DropdownMenuLabel className="text-xs uppercase tracking-[0.25em] text-slate-300">
                Navigation
              </DropdownMenuLabel>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const isDisabled = !!(item.requiresAuth && !session?.user);

                if (isDisabled) {
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      disabled
                      className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm text-slate-400"
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.name}
                      </span>
                      <span className="text-[11px] uppercase text-slate-500">Sign in</span>
                    </DropdownMenuItem>
                  );
                }

                return (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-3 py-2 text-sm transition ${
                      isActive ? "bg-slate-800/80 text-white" : "text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      {item.icon}
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="my-2 bg-white/10" />
              <div className="px-2 pb-1">
                <AuthButtons />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

