import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  ChartNoAxesColumn,
  Compass,
  Heart,
  House,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Refrigerator,
  Settings,
  UserRound,
} from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { cx, initials } from "../utils/format";
import Logo from "../Components/Logo";
import Button from "../Components/Button";
import { PageLoader } from "../Components/Feedback";

const NAV = [
  { to: "/browse", label: "Find food" },
  { to: "/browse?today=1", label: "Rescue today" },
  { to: "/impact", label: "Impact" },
  { to: "/tips", label: "Storage guide" },
];

function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) return null;
  const links = [
    { to: "/dashboard", label: "My WasteLess", icon: LayoutDashboard },
    { to: "/pantry", label: "My pantry", icon: Refrigerator },
    { to: "/my-listings", label: "My listings", icon: Package },
    { to: "/my-requests", label: "My requests", icon: Inbox },
    { to: `/people/${user.id}`, label: "Public profile", icon: UserRound },
    { to: "/account", label: "Account settings", icon: Settings },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Your account"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-sm font-bold text-sprout ring-4 ring-transparent transition hover:ring-mint"
      >
        {initials(user.orgName || user.name)}
      </button>
      {open && (
        <div className="absolute right-0 top-13 w-64 overflow-hidden rounded-3xl bg-white p-2 shadow-float ring-1 ring-forest/5 motion-safe:animate-fade-in">
          <div className="px-3 py-2.5">
            <div className="truncate font-semibold text-on-surface">{user.orgName || user.name}</div>
            <div className="truncate text-xs text-on-surface-variant">{user.email}</div>
          </div>
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-low">
              <Icon className="h-4 w-4 text-leaf" /> {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-error hover:bg-error-container/50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { isAuthenticated } = useAuth();
  const { pathname, search } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) => {
    const [path, query] = to.split("?");
    if (pathname !== path) return false;
    return query ? search.includes(query) : !search.includes("today=1");
  };

  return (
    <header className={cx("sticky top-0 z-50 bg-surface/85 backdrop-blur-xl transition-shadow duration-300", scrolled && "shadow-card")}>
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 md:h-20 md:px-8">
        <Link to="/" aria-label="WasteLess home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive(link.to) ? "page" : undefined}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive(link.to) ? "bg-forest text-white" : "text-on-surface-variant hover:bg-surface-container hover:text-forest",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Phones have the Share tab instead. A wrapper does the hiding:
              "hidden" on the button itself loses to its own inline-flex. */}
          <span className="hidden sm:block">
            <Button to="/share" size="md">
              <Plus className="h-4 w-4" /> Share food
            </Button>
          </span>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Button to="/login" variant="ghost" size="md">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// Phones get a tab bar at the bottom, where thumbs reach.
function TabBar() {
  const { isAuthenticated } = useAuth();
  const tabs = [
    { to: "/", label: "Home", icon: House, end: true },
    { to: "/browse", label: "Find", icon: Compass, end: false },
    { to: "/share", label: "Share", icon: Plus, end: false, primary: true },
    { to: isAuthenticated ? "/pantry" : "/impact", label: isAuthenticated ? "Pantry" : "Impact", icon: isAuthenticated ? Refrigerator : ChartNoAxesColumn, end: false },
    { to: isAuthenticated ? "/dashboard" : "/login", label: isAuthenticated ? "Me" : "Sign in", icon: UserRound, end: false },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-forest/8 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      aria-label="Tabs"
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, end, primary }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx("flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold", isActive && !primary ? "text-forest" : "text-outline")
            }
          >
            {primary ? (
              <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-forest text-sprout shadow-lift">
                <Icon className="h-6 w-6" />
              </span>
            ) : (
              <Icon className="h-5.5 w-5.5" />
            )}
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-20 bg-forest-deep pb-24 text-white/75 sm:pb-0">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Good food shouldn't end up in the bin. WasteLess connects people, businesses and food banks to share surplus food
            nearby, and helps every kitchen use what it has.
          </p>
        </div>
        {[
          { title: "Share", links: [["Share surplus food", "/share"], ["Rescue today", "/browse?today=1"], ["Find food", "/browse"]] },
          { title: "Your kitchen", links: [["Pantry tracker", "/pantry"], ["Use-it-up ideas", "/pantry#ideas"], ["Storage guide", "/tips"]] },
          { title: "WasteLess", links: [["Our impact", "/impact"], ["For businesses", "/register?type=business"], ["For food banks", "/register?type=organisation"]] },
        ].map((column) => (
          <div key={column.title}>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-sprout">{column.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span>&copy; {new Date().getFullYear()} WasteLess. Share surplus food, waste less.</span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-sprout" /> Made in Lagos for every neighbourhood
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 sm:pb-0">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <TabBar />
    </div>
  );
}
