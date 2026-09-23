import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema, AdminLoginInput } from "@/schemas/auth.schema";
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
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const watchEmail = watch("email");
  const watchPassword = watch("password");
  const isFormValid = Boolean(watchEmail?.trim() && watchPassword?.trim());

  const onLogin = async (data: AdminLoginInput) => {
    clearError();
    const success = await login({
      email: data.email.trim(),
      password: data.password,
    });

    if (success) {
      toast.success("Welcome to PujaCircle Operations Console.");
      navigate("/admin/dashboard");
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
                  Staff Operations Console
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Platform Governance</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-white leading-snug">
                Operations Console & Moderation
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Authorized staff portal for vetting Purohit Gurukul credentials,
                catalog moderation, devotee disputes, and ceremony quality
                assurance.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Priest verification & background checks</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Puja catalog CRUD & Samagri rules</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>User account moderation & security</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-amber-400/30 space-y-1">
            <div className="text-xs font-serif text-amber-200 italic">
              “सत्यमेव जयते नानृतम् — Truth alone triumphs.”
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              — Mundaka Upanishad
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 bg-white flex flex-col justify-between relative">
          <div>
            {/* Top Row: Portal Badge */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-100/70 border border-amber-300 text-xs font-bold text-[#780016]">
                <ShieldCheck className="h-4 w-4 text-[#780016]" />
                <span>Staff Operations Portal</span>
              </div>
            </div>

            <div className="mb-6 pb-3 border-b border-stone-100">
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                Staff Sign In
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Enter authorized administrator credentials to proceed
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
                  Staff Email Address
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
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold text-stone-800"
                  >
                    Administrator Password
                  </Label>
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
                  "Verifying..."
                ) : (
                  <>
                    <span>Enter Operations Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
            <div>Restricted Area • Authorized staff access only</div>
            <Link
              to="/user/login"
              className="text-[#780016] font-bold hover:underline"
            >
              ← Return to Devotee Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
