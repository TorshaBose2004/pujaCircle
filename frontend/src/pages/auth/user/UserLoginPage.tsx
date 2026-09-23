import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userLoginSchema, UserLoginInput } from "@/schemas/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { AuthRoleTabs } from "@/components/auth/AuthRoleTabs";

export const UserLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserLoginInput>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const watchEmail = watch("email");
  const watchPassword = watch("password");
  const isFormValid = Boolean(watchEmail?.trim() && watchPassword?.trim());

  const onLogin = async (data: UserLoginInput) => {
    clearError();
    const email = data.email.trim();

    const success = await login({
      email,
      password: data.password,
    });

    if (success) {
      const user = useAuthStore.getState().user;
      if (user?.role === "PRIEST") {
        toast.info(
          "Welcome Acharya! Redirecting to your ceremonial command altar.",
        );
        navigate("/priest/dashboard");
      } else if (user?.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        toast.success(
          "Namaste Devotee! Welcome to your sacred sanctuary portal.",
        );
        navigate("/user/home");
      }
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
                  Devotee Sanctum
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Sacred Home Rituals</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-white leading-snug">
                Authentic Vedic Ceremonies at Home
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Connect with verified Gurukul-trained Purohits with complete
                transparency, authentic samagri guidance, and zero advance fees.
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
              “यज्ञो वै श्रेष्ठतमं कर्म — Yajna is the highest auspicious deed.”
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              — Satapatha Brahmana
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 bg-white flex flex-col justify-between relative">
          <div>
            {/* Role Switcher Tabs */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <AuthRoleTabs
                activeRole="USER"
                onRoleChange={(role) => {
                  if (role === "PRIEST") navigate("/priest/login");
                }}
                className="mb-0 w-full sm:w-auto"
              />

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/admin/login"
                  title="Staff Operations Portal"
                  aria-label="Staff Operations Portal"
                  className="text-stone-400 hover:text-[#780016] transition-colors p-1.5 rounded-md hover:bg-amber-50 cursor-pointer"
                >
                  <Shield className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mb-6 pb-3 border-b border-stone-100">
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                Devotee Sign In
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Access your ceremony bookings and sacred Muhurat requests
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-stone-800"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email..."
                    {...register("email")}
                    className="pl-9 h-11 text-sm border-stone-300 focus-visible:ring-amber-500"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold text-stone-800"
                  >
                    Account Password
                  </Label>
                  <Link
                    to="/user/forgot-password"
                    className="text-xs text-[#780016] hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password..."
                    {...register("password")}
                    className="pl-9 pr-10 h-11 text-sm border-stone-300 focus-visible:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full h-11 bg-[#780016] hover:bg-[#5a0010] text-white font-semibold text-sm shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    <span>Enter Devotee Sanctum</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-stone-100 text-center text-xs text-stone-600">
            New to PujaCircle?{" "}
            <Link
              to="/user/register"
              className="text-[#780016] font-bold hover:underline"
            >
              Create Devotee Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;
