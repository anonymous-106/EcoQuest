import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ComponentType } from "react";

// Pages
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Calculator from "@/pages/Calculator";
import Challenges from "@/pages/Challenges";
import Recommendations from "@/pages/Recommendations";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Learn from "@/pages/Learn";
import NotFound from "@/pages/not-found";
import Shell from "@/components/layout/Shell";

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(152 65% 42%)",
    colorForeground: "hsl(160 50% 15%)",
    colorMutedForeground: "hsl(160 20% 40%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(150 20% 85%)",
    colorInputForeground: "hsl(160 50% 15%)",
    colorNeutral: "hsl(150 20% 90%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-green-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold font-['Outfit'] text-green-950",
    headerSubtitle: "text-green-700",
    socialButtonsBlockButtonText: "font-medium",
    formFieldLabel: "text-green-900 font-medium",
    footerActionLink: "text-green-600 font-semibold hover:text-green-700",
    footerActionText: "text-green-700",
    dividerText: "text-green-600",
    identityPreviewEditButton: "text-green-600 hover:text-green-700",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600",
    logoBox: "h-12 w-auto mb-4",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border-green-200 hover:bg-green-50",
    formButtonPrimary: "bg-green-600 hover:bg-green-700 shadow-sm",
    formFieldInput: "border-green-200 focus:border-green-600 focus:ring-green-600 bg-white",
    footerAction: "bg-green-50/50 pt-6 pb-6",
    dividerLine: "bg-green-100",
    alert: "border-red-200 bg-red-50",
    otpCodeFieldInput: "border-green-200 focus:border-green-600",
    formFieldRow: "mb-4",
    main: "gap-6 p-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-green-50 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-green-50 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Shell>
          <Component />
        </Shell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function App() {
  const [, setLocation] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        routerPush={(to) => setLocation(stripBase(to))}
        routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      >
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/calculator">
                <Shell><Calculator /></Shell>
              </Route>
              <Route path="/learn">
                <Shell><Learn /></Shell>
              </Route>
              <Route path="/onboarding" component={() => <ProtectedRoute component={Onboarding} />} />
              <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
              <Route path="/challenges" component={() => <ProtectedRoute component={Challenges} />} />
              <Route path="/recommendations" component={() => <ProtectedRoute component={Recommendations} />} />
              <Route path="/leaderboard" component={() => <ProtectedRoute component={Leaderboard} />} />
              <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

export default App;
