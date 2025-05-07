"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButtons } from "./auth-buttons";
import { Button } from "@/components/ui/button";
import { Database, Save, Settings, BarChart2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    {
      name: "Generator",
      href: "/generator",
      icon: <Database className="h-4 w-4 mr-2" />,
    },
    {
      name: "Saved Schemas",
      href: "/saved",
      icon: <Save className="h-4 w-4 mr-2" />,
    },
    {
      name: "API Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
  ];

  // Only show events log for authenticated users
  if (session?.user) {
    navItems.push({
      name: "Event Log",
      href: "/dashboard/events",
      icon: <BarChart2 className="h-4 w-4 mr-2" />,
    });
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Database className="h-6 w-6" />
          <span className="font-bold">MockRG.AI</span>
        </Link>
        <nav className="ml-auto flex items-center space-x-1 md:space-x-2">
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href || pathname?.startsWith(item.href + '/') ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={item.href} className="flex items-center">
                  {item.icon}
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
          <div className="ml-2">
            <AuthButtons />
          </div>
        </nav>
      </div>
      <div className="md:hidden border-t">
        <div className="container mx-auto flex justify-between px-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href || pathname?.startsWith(item.href + '/') ? "default" : "ghost"}
              size="sm"
              asChild
              className="flex-1"
            >
              <Link
                href={item.href}
                className="flex items-center justify-center py-2"
              >
                {item.icon}
                <span className="sr-only md:not-sr-only">{item.name}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}
