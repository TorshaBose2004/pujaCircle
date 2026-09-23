import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  Users,

  Calendar,
  MapPin,
  User,
  LogOut,
  Menu,
  ChevronDown,
  Info,
  Phone,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { PujaCircleLogo } from '@/components/common/PujaCircleLogo';

// Navbar
// Renders strictly on PublicLayout for Guest visitors and authenticated Devotees (USER role).
// Priest and Admin portals are rendered exclusively within DashboardSidebarShell and never see this.
export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Authenticated devotee state
  const isDevotee = isAuthenticated && user?.role === 'USER';
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative transition-all font-semibold text-xs sm:text-sm flex items-center gap-1.5 py-1.5 px-3.5 rounded-md cursor-pointer select-none',
      isActive
        ? 'text-[#780016] font-bold bg-amber-100/90 border border-amber-300 shadow-xs'
        : 'text-stone-700 hover:text-[#780016] hover:bg-amber-50/70 border border-transparent'
    );

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-colors border-l-2',
      isActive
        ? 'bg-amber-100 text-[#780016] font-bold border-amber-500'
        : 'text-stone-700 hover:bg-amber-50/60 hover:text-stone-950 border-transparent'
    );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-300/90 bg-white/95 backdrop-blur-xs text-stone-900 shadow-xs">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand Logo & Tag */}
        <Link
          to={isDevotee ? '/user/home' : '/'}
          className="flex items-center gap-2 font-bold text-lg sm:text-xl text-stone-950 tracking-tight group select-none shrink-0"
        >
          <PujaCircleLogo size={32} className="shadow-sm transition-transform group-hover:scale-105 shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-stone-950 font-extrabold text-lg sm:text-xl">
              Puja<span className="text-[#991B1B] font-sans font-bold">Circle</span>
            </span>
           
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
          {isDevotee ? (
            <>
              <NavLink to="/user/home" className={navLinkClass}>
                <Home className="h-4 w-4 text-amber-700" />
                <span>Home</span>
              </NavLink>
              <NavLink to="/priests" className={navLinkClass}>
                <Users className="h-4 w-4 text-amber-700" />
                <span>Browse Priests</span>
              </NavLink>

              <NavLink to="/user/bookings" className={navLinkClass}>
                <Calendar className="h-4 w-4 text-amber-700" />
                <span>My Bookings</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" end className={navLinkClass}>
                <Home className="h-4 w-4 text-amber-700" />
                <span>Home</span>
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                <Info className="h-4 w-4 text-amber-700" />
                <span>About</span>
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                <Phone className="h-4 w-4 text-amber-700" />
                <span>Contact</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Right Actions & Authentication Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isDevotee && user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                id="navbar-profile-dropdown-btn"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1.5 h-9 rounded-md border border-amber-300 bg-white text-stone-900 shadow-xs hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                aria-haspopup="true"
                aria-expanded={profileDropdownOpen}
              >
                <Avatar className="h-6 w-6 ring-1 ring-amber-400 bg-amber-50 shrink-0">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-[11px] font-serif font-bold text-red-800 bg-amber-100">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-semibold text-xs text-stone-900 max-w-28 sm:max-w-36">
                  {user.name}
                </span>
                <ChevronDown className={cn("h-3 w-3 text-stone-500 opacity-70 shrink-0 transition-transform duration-200", profileDropdownOpen && "rotate-180")} />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-56 p-1.5 bg-white border-2 border-amber-300 shadow-xl rounded-lg z-50 animate-in fade-in-0 zoom-in-95"
                  role="menu"
                >
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-bold font-serif text-stone-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">{user.phoneNumber || user.email}</p>
                  </div>
                  <div className="h-px bg-amber-100 my-1" />

                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/user/profile');
                      }}
                      className="w-full flex items-center gap-2.5 text-xs py-2 px-2 cursor-pointer rounded-sm hover:bg-amber-50 text-stone-800 transition-colors text-left"
                    >
                      <User className="h-3.5 w-3.5 text-stone-700 shrink-0" />
                      <span>Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/user/addresses');
                      }}
                      className="w-full flex items-center gap-2.5 text-xs py-2 px-2 cursor-pointer rounded-sm hover:bg-amber-50 text-stone-800 transition-colors text-left"
                    >
                      <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>My Addresses</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/user/bookings');
                      }}
                      className="w-full flex items-center gap-2.5 text-xs py-2 px-2 cursor-pointer rounded-sm hover:bg-amber-50 text-stone-800 transition-colors text-left"
                    >
                      <Calendar className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                      <span>My Bookings</span>
                    </button>
                  </div>

                  <div className="h-px bg-amber-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 text-xs py-2 px-2 text-red-700 hover:bg-red-50 cursor-pointer rounded-sm font-semibold transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center">
              <Link to="/user/login">
                <Button
                  size="sm"
                  className="text-xs font-bold bg-[#991B1B] hover:bg-[#780016] text-white shadow-xs active:scale-[0.98] transition-all rounded-md px-5 h-9 border border-amber-400/60 cursor-pointer"
                >
                  Login
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Drawer (Visible on small screens) */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-stone-800 hover:text-stone-950 hover:bg-amber-50 rounded-md"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-72 sm:w-80 bg-[#FAF7F2] border-l-2 border-amber-300 p-0 text-stone-900 flex flex-col justify-between">
              <div>
                <div className="h-16 border-b border-amber-200/80 flex items-center justify-between px-5 bg-white">
                  <div className="flex items-center gap-2.5">
                    <PujaCircleLogo size={28} />
                    <span className="font-serif font-black text-lg text-stone-950">
                      Puja<span className="text-[#991B1B] font-sans font-bold">Circle</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {isDevotee ? (
                    <>
                      <NavLink
                        to="/user/home"
                        onClick={() => setMobileMenuOpen(false)}
                        className={mobileNavLinkClass}
                      >
                        <Home className="h-4 w-4 text-amber-700" />
                        <span>Home</span>
                      </NavLink>
                      <NavLink
                        to="/priests"
                        onClick={() => setMobileMenuOpen(false)}
                        className={mobileNavLinkClass}
                      >
                        <Users className="h-4 w-4 text-amber-700" />
                        <span>Browse Priests</span>
                      </NavLink>

                      <NavLink
                        to="/user/bookings"
                        onClick={() => setMobileMenuOpen(false)}
                        className={mobileNavLinkClass}
                      >
                        <Calendar className="h-4 w-4 text-amber-700" />
                        <span>My Bookings</span>
                      </NavLink>
                    </>
                  ) : (
                    <>
                      <NavLink
                        to="/"
                        end
                        onClick={() => setMobileMenuOpen(false)}
                        className={mobileNavLinkClass}
                      >
                        <Home className="h-4 w-4 text-amber-700" />
                        <span>Home</span>
                      </NavLink>
                      <NavLink
                        to="/about"
                        onClick={() => setMobileMenuOpen(false)}
                        className={mobileNavLinkClass}
                      >
                        <Info className="h-4 w-4 text-amber-700" />
                        <span>About</span>
                      </NavLink>
                      <NavLink
                        to="/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className={mobileNavLinkClass}
                      >
                        <Phone className="h-4 w-4 text-amber-700" />
                        <span>Contact</span>
                      </NavLink>
                    </>
                  )}
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="p-4 border-t border-amber-200/80 bg-white">
                {isDevotee && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-1 ring-amber-400">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="text-xs font-bold text-red-800 bg-amber-100">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="text-xs font-bold text-stone-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-stone-500 truncate">{user.phoneNumber || user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Link
                        to="/user/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 py-1.5 text-xs text-stone-700 hover:text-stone-950 font-medium"
                      >
                        <User className="h-3.5 w-3.5 text-stone-600" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/user/addresses"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 py-1.5 text-xs text-stone-700 hover:text-stone-950 font-medium"
                      >
                        <MapPin className="h-3.5 w-3.5 text-amber-600" />
                        <span>My Addresses</span>
                      </Link>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full text-xs font-bold text-red-700 border-red-200 hover:bg-red-50 gap-2 h-9 rounded-md"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <Link to="/user/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                    <Button className="w-full bg-[#991B1B] hover:bg-[#780016] text-white font-bold text-xs h-10 rounded-md shadow-sm">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
