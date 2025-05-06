"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, getProviders, LiteralUnion, ClientSafeProvider, useSession } from "next-auth/react";
import { BuiltInProviderType } from "next-auth/providers/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, LogOut, CheckCircle } from "lucide-react";
import Image from "next/image"; // lucide-react dosnt have a google logo....so we use this

const ProviderIcon = ({ providerId }: { providerId: string }) => {
  if (providerId === "github") {
    return <Github className="mr-2 h-5 w-5" />;
  }
  if (providerId === "google") {
    return (
      <Image
        src="/logos/google-logo.svg"
        alt="Google logo"
        width={20}
        height={20}
        className="mr-2"
      />
    );
  }
  return null;
};

export default function SignInPage() {
  const { data: session, status } = useSession();
  const [providers, setProviders] = useState<Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider> | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      const setupProviders = async () => {
        setLoadingProviders(true);
        try {
          const res = await getProviders();
          setProviders(res);
        } catch (error) {
          console.error("Failed to get providers:", error);
          setProviders(null);
        } finally {
          setLoadingProviders(false);
        }
      };
      setupProviders();
    } else {
      setLoadingProviders(false);
      setProviders(null);
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Checking authentication status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4 text-2xl font-bold">Successfully Signed In</CardTitle>
            <CardDescription>You are now logged in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
            <hr className="my-4" />
            <p className="text-sm text-muted-foreground">Not the account you wanted?</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Choose a provider to sign in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingProviders ? (
            <div className="text-center text-muted-foreground">Loading sign-in options...</div>
          ) : providers ? (
            Object.values(providers).map((provider) => {
              if (provider.type === "email") return null;
              return (
                <div key={provider.name}>
                  <Button
                    variant="outline"
                    className="w-full justify-center items-center"
                    onClick={() => signIn(provider.id)}
                  >
                    <ProviderIcon providerId={provider.id} />
                    Sign in with {provider.name}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="text-center text-red-500">Error loading sign-in options. Please try again later.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 