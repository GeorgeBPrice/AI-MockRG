import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center gap-4 md:h-16 md:flex-row md:justify-center">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          © {new Date().getFullYear()} AI Mocker. All rights reserved. {" "} 
          <Link
            href="/terms"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            Terms of Use
          </Link>
        </p>
      </div>
    </footer>
  );
} 