import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userLoginSchema, adminLoginSchema, UserLoginInput, AdminLoginInput } from '@/schemas/auth.schema';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Phone,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  User,
  Users,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authApi } from '@/api/auth.api';

export interface AuthPageProps {
  defaultTab?: 'devotee' | 'priest';
  revealAdmin?: boolean;
}

// Unified Authentication Page
// Provides:
// 1. Devotee & Priest tabs with in-place toggle between Login and Register
// 2. Direct live API integration with Supabase Auth & PostgreSQL backend
// 3. Low-emphasis "Staff Access" link that reveals the staff login panel inline without routing
// 4. Aliased by /user/login, /priest/login, and /admin/login (with pre-revealed staff panel)
export const AuthPage: React.FC<AuthPageProps> = ({
  defaultTab = 'devotee',
  revealAdmin = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, setUser, isLoading, error, clearError } = useAuthStore();

  // Tab state & Staff panel state
  const queryTab = searchParams.get('tab')?.toLowerCase();
  const initialTab: 'devotee' | 'priest' =
    queryTab === 'priest' || defaultTab === 'priest' ? 'priest' : 'devotee';

  const isStaffPath = location.pathname.includes('/admin/login') || searchParams.get('reveal') === 'admin';
  const [activeTab, setActiveTab] = useState<'devotee' | 'priest'>(initialTab);
  const [showStaff, setShowStaff] = useState<boolean>(revealAdmin || isStaffPath);
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Registration in-place state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSamhita, setRegSamhita] = useState('Rigveda');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (revealAdmin || isStaffPath) {
      setShowStaff(true);
    }
  }, [revealAdmin, isStaffPath]);

  // Login form handlers for Devotee & Priest
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    reset: resetLogin,
    formState: { errors: loginErrors },
  } = useForm<UserLoginInput>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Login form handler for Staff / Admin
  const {
    register: registerAdmin,
    handleSubmit: handleAdminSubmit,
    formState: { errors: adminErrors },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleTabSwitch = (tab: 'devotee' | 'priest') => {
    setActiveTab(tab);
    setIsRegister(false);
    clearError();
    resetLogin({ email: '', password: '' });
  };

  // Submit Login for Devotee / Priest
  const onLogin = async (data: UserLoginInput) => {
    clearError();
    const email = data.email.trim();

    const success = await login({
      email,
      password: data.password,
    });

    if (success) {
      const user = useAuthStore.getState().user;
      if (user?.role === 'PRIEST' || activeTab === 'priest') {
        toast.success('Namaste Purohit-ji! Welcome to your operations workspace.');
        navigate('/priest/dashboard');
      } else if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        toast.success('Namaste Devotee! Welcome to your sacred sanctuary portal.');
        navigate('/user/home');
      }
    }
  };

  // Submit Staff Login
  const onStaffLogin = async (data: AdminLoginInput) => {
    clearError();
    const success = await login({
      email: data.email.trim(),
      password: data.password,
    });

    if (success) {
      toast.success('Welcome to PujaCircle Operations Console.');
      navigate('/admin/dashboard');
    }
  };



  // In-place Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regPhone || !regPassword) {
      toast.error('Please enter full name, mobile number, and password.');
      return;
    }

    setIsSubmittingReg(true);
    const cleanPhone = regPhone.startsWith('+91')
      ? regPhone
      : `+91${regPhone.replace(/\D/g, '')}`;

    try {
      const email = regEmail.trim() || `${regFullName.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now().toString().slice(-4)}@pujacircle.com`;

      if (activeTab === 'priest') {
        const res = await authApi.registerPriest({
          fullName: regFullName,
          email,
          phoneNumber: cleanPhone,
          password: regPassword,
        });

        if (res.success && res.data?.user) {
          setUser(res.data.user);
          toast.success('Application submitted! Welcome to PujaCircle Purohit roster.');
          navigate('/priest/pending-approval');
        } else {
          toast.error(res.message || 'Registration failed.');
        }
      } else {
        const res = await authApi.registerUser({
          fullName: regFullName,
          email,
          phoneNumber: cleanPhone,
          password: regPassword,
        });

        if (res.success && res.data?.user) {
          setUser(res.data.user);
          toast.success('Devotee account created! Welcome to PujaCircle.');
          navigate('/user/home');
        } else {
          toast.error(res.message || 'Registration failed.');
        }
      }
    } catch {
      toast.error('Registration failed. Please verify your details.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-4xl rounded-xl border-2 border-amber-300 bg-white shadow-xl overflow-hidden flex flex-col lg:flex-row items-stretch">
        {/* Left Showcase Panel (Solid Sacred Vermilion `#780016`) */}
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-[#780016] text-white p-8 sm:p-10 border-r-2 border-amber-400/40 relative">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-md bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-black text-2xl shadow-md select-none">
                ॐ
              </div>
              <div>
                <div className="font-serif font-black text-lg tracking-wider text-amber-300">
                  PUJACIRCLE
                </div>
                <div className="text-[10px] text-amber-100 uppercase tracking-widest font-semibold">
                  {showStaff ? 'Staff Portal' : activeTab === 'priest' ? 'Purohit Portal' : 'Devotee Sanctum'}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {showStaff ? 'Platform Governance' : activeTab === 'priest' ? 'Vedic Purohit Service' : 'Sacred Home Rituals'}
                </span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-white leading-snug">
                {showStaff
                  ? 'Operations Console & Management'
                  : activeTab === 'priest'
                  ? 'Serve Devotees with Sacred Lineage'
                  : 'Authentic Vedic Ceremonies at Home'}
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {showStaff
                  ? 'Authorized staff portal for vetting Purohit Gurukul credentials, catalog moderation, and ceremony quality assurance.'
                  : activeTab === 'priest'
                  ? 'Accept verified puja requests in your locality across West Bengal and receive 100% direct cash dakshina.'
                  : 'Connect with verified Gurukul-trained Purohits with complete transparency and zero advance fees.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Verified Gurukul Purohits across West Bengal</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>100% Direct Cash Dakshina after ritual</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Transparent Samagri Lists & Vidhi Steps</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-amber-400/30 space-y-1">
            <div className="text-xs font-serif text-amber-200 italic">
              {showStaff
                ? '“सत्यमेव जयते नानृतम् — Truth alone triumphs.”'
                : activeTab === 'priest'
                ? '“विद्वत्वं च नृपत्वं च नैव तुल्यं कदाचन — Sacred wisdom surpasses all royalty.”'
                : '“यज्ञो वै श्रेष्ठतमं कर्म — Yajna is the highest auspicious deed.”'}
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              {showStaff ? '— Mundaka Upanishad' : activeTab === 'priest' ? '— Chanakya Niti' : '— Satapatha Brahmana'}
            </div>
          </div>
        </div>

        {/* Right Interactive Form Panel */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 bg-white flex flex-col justify-between relative">
          <div>
            {/* Top Navigation: Two Primary Tabs (Devotee & Priest) unless in Staff view */}
            {showStaff ? (
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#991B1B]" />
                  <h1 className="font-serif text-xl font-bold text-stone-900">
                    Staff Access Portal
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowStaff(false);
                    clearError();
                  }}
                  className="text-xs text-[#991B1B] hover:underline font-semibold cursor-pointer"
                >
                  ← Return to Sign In
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="inline-flex p-1 rounded-md bg-amber-100/70 border border-amber-300 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('devotee')}
                    className={cn(
                      'flex-1 sm:flex-initial px-5 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
                      activeTab === 'devotee'
                        ? 'bg-white text-[#780016] shadow-xs'
                        : 'text-stone-700 hover:text-stone-950'
                    )}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Devotee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabSwitch('priest')}
                    className={cn(
                      'flex-1 sm:flex-initial px-5 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
                      activeTab === 'priest'
                        ? 'bg-white text-[#780016] shadow-xs'
                        : 'text-stone-700 hover:text-stone-950'
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Priest (Purohit)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Header Titles */}
            {!showStaff && (
              <div className="space-y-1 mb-6">
                <h1 className="text-2xl font-bold font-serif text-stone-900">
                  {isRegister
                    ? activeTab === 'priest'
                      ? 'Apply as Vedic Purohit'
                      : 'Create Devotee Account'
                    : activeTab === 'priest'
                    ? 'Vedic Purohit Sign In'
                    : 'Devotee Sign In'}
                </h1>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isRegister
                    ? activeTab === 'priest'
                      ? 'Register your Gurukul credentials to receive localized home ceremony invitations.'
                      : 'Join PujaCircle to schedule authentic home rituals with verified purohits.'
                    : activeTab === 'priest'
                    ? 'Access your ceremony appointments, schedule availability, and dakshina earnings.'
                    : 'Access your ceremony bookings, family milestones, and verified Purohits.'}
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* --- PANEL 1: STAFF LOGIN (Admin) --- */}
            {showStaff ? (
              <form onSubmit={handleAdminSubmit(onStaffLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-800">Staff Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@pujaCircle.com"
                      {...registerAdmin('email')}
                      className="pl-9 h-11 text-xs border-stone-300 focus-visible:ring-amber-500"
                    />
                  </div>
                  {adminErrors.email && (
                    <p className="text-[11px] text-red-600 font-medium">{adminErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-800">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerAdmin('password')}
                      className="pl-10 pr-10 text-xs h-10 border-stone-300 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {adminErrors.password && (
                    <p className="text-[11px] text-red-600 font-medium">{adminErrors.password.message}</p>
                  )}
                </div>



                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#780016] hover:bg-[#600012] text-white font-bold text-xs h-11 shadow-md gap-2 mt-2 cursor-pointer"
                >
                  {isLoading ? 'Verifying Authorization...' : 'Sign In to Staff Console'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            ) : isRegister ? (
              /* --- PANEL 2: IN-PLACE REGISTRATION FORM --- */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      type="text"
                      placeholder={activeTab === 'priest' ? 'Pandit Debabrata Acharya' : 'Aditi Sharma'}
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="pl-10 text-xs h-10 border-stone-300 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Mobile Number (+91)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      type="tel"
                      placeholder="+919876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="pl-10 text-xs h-10 border-stone-300 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Email Address (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      type="email"
                      placeholder="devotee@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="pl-10 text-xs h-10 border-stone-300 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {activeTab === 'priest' && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-stone-700">Vedic Tradition / Samhita</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                      <Input
                        type="text"
                        placeholder="Rigveda / Shukla Yajurveda"
                        value={regSamhita}
                        onChange={(e) => setRegSamhita(e.target.value)}
                        className="pl-10 text-xs h-10 border-stone-300 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-10 pr-10 text-xs h-10 border-stone-300 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="w-full bg-[#991B1B] hover:bg-[#780016] text-white font-bold text-xs h-11 shadow-md gap-2 mt-2 cursor-pointer"
                >
                  {isSubmittingReg
                    ? 'Submitting Registration...'
                    : activeTab === 'priest'
                    ? 'Submit Purohit Application'
                    : 'Create Devotee Account'}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="pt-3 text-center text-xs text-stone-600">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="text-[#991B1B] font-bold hover:underline cursor-pointer"
                  >
                    Sign In instead →
                  </button>
                </div>
              </form>
            ) : (
              /* --- PANEL 3: LOGIN FORM (Devotee or Priest) --- */
              <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      type="email"
                      placeholder={activeTab === 'priest' ? 'schakra@pujacircle.com' : 'arnab@pujacircle.com'}
                      {...registerLogin('email')}
                      className="pl-10 text-xs h-10 border-stone-300 focus:ring-amber-500"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {loginErrors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-stone-700">
                      Password
                    </Label>
                    <Link
                      to={activeTab === 'priest' ? '/priest/forgot-password' : '/user/forgot-password'}
                      className="text-[11px] text-[#991B1B] hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerLogin('password')}
                      className="pl-10 pr-10 text-xs h-10 border-stone-300 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>



                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#780016] hover:bg-[#600012] text-white font-bold text-xs h-11 shadow-md gap-2 mt-2 cursor-pointer"
                >
                  {isLoading
                    ? 'Verifying Credentials...'
                    : `Sign In as ${activeTab === 'priest' ? 'Purohit' : 'Devotee'}`}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {/* In-Place Toggle to Register Form */}
                <div className="pt-4 border-t border-stone-200 text-center text-xs text-stone-600">
                  {activeTab === 'priest' ? 'New priest?' : 'New devotee?'}{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="text-[#991B1B] font-bold hover:underline ml-1 cursor-pointer"
                  >
                    {activeTab === 'priest' ? 'Register / Apply to Join Roster →' : 'Register Account →'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Bottom Unobtrusive Staff Access Link (Only shown when not already on staff panel) */}
          {!showStaff && (
            <div className="pt-6 text-center border-t border-stone-100 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowStaff(true);
                  clearError();
                }}
                className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                Staff Access
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
