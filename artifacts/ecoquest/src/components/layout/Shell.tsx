import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { 
  LayoutDashboard, 
  Calculator, 
  Target, 
  Lightbulb, 
  Trophy, 
  User as UserIcon, 
  BookOpen, 
  LogOut, 
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/challenges", label: "Challenges", icon: Target },
  { href: "/recommendations", label: "Ideas", icon: Lightbulb },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export default function Shell({ children }: ShellProps) {
  const [location] = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const NavLinks = () => (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <span
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 border-b bg-background px-4 h-16 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"}>
          <span className="flex items-center gap-2 font-bold text-xl font-['Outfit'] text-primary cursor-pointer">
            <img src="/logo.svg" alt="EcoQuest Logo" className="h-8 w-8" />
            EcoQuest
          </span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6">
              <Link href={user ? "/dashboard" : "/"}>
                <span className="flex items-center gap-2 font-bold text-2xl font-['Outfit'] text-primary cursor-pointer mb-8">
                  <img src="/logo.svg" alt="EcoQuest Logo" className="h-8 w-8" />
                  EcoQuest
                </span>
              </Link>
              <nav className="flex flex-col gap-2">
                <NavLinks />
              </nav>
            </div>
            {isLoaded && user && (
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-sidebar">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => signOut({ redirectUrl: "/" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar h-screen sticky top-0 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Link href={user ? "/dashboard" : "/"}>
            <span className="flex items-center gap-2 font-bold text-2xl font-['Outfit'] text-primary cursor-pointer">
              <img src="/logo.svg" alt="EcoQuest Logo" className="h-8 w-8" />
              EcoQuest
            </span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-2 flex flex-col gap-2 overflow-y-auto">
          <NavLinks />
        </nav>
        {isLoaded && user && (
          <div className="p-4 border-t border-sidebar-border mt-auto">
            <div className="flex items-center gap-3 mb-4 p-2">
              <Avatar>
                <AvatarImage src={user.imageUrl} />
                <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut({ redirectUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}