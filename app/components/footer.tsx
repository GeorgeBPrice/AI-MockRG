import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6 px-6">
      <div className="container mx-auto flex justify-center">
        <p className="text-sm leading-loose text-muted-foreground text-center">
          © {new Date().getFullYear()} AI Mocker. All rights reserved.{" "}
          <Link
            href="/terms"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            Terms of Use
          </Link>
          {" · "}
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}