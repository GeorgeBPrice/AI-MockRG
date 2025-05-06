import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Database, Github, Code, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          <Database className="inline-block mr-2 mb-1" size={36} />
          AI. Mock Record Generator
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Generate realistic mock records based on database schemas for
          development and testing, leveraging AI-powered data generation.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8 md:mb-12">
        <Button size="lg" asChild>
          <Link href="/generator">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link
            href="https://github.com/GeorgeBPrice/AI-MockRG"
            target="_blank"
          >
            <Github className="mr-2 h-4 w-4" /> Open Source in GitHub
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center p-6 border rounded-lg">
          <Database className="h-10 w-10 mb-4" />
          <h3 className="text-xl font-semibold mb-2">SQL & NoSQL Support</h3>
          <p className="text-muted-foreground">
            Generate mock data for SQL tables or NoSQL collections with
            relationship support.
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-6 border rounded-lg">
          <Code className="h-10 w-10 mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
          <p className="text-muted-foreground">
            Realistic contextual data generated with AI for meaningful test
            datasets.
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-6 border rounded-lg">
          <svg
            className="h-10 w-10 mb-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Free & Open Source</h3>
          <p className="text-muted-foreground">
            Completely free-to-use with your own API key. Limited free usage also available.
          </p>
        </div>
      </div>
    </div>
  );
}
