import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
} from "@/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthRoleTabs } from "@/components/auth/AuthRoleTabs";
import {
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";

export interface ForgotPasswordCardProps {
  defaultRole?: "USER" | "PRIEST";
}

/**
 * ForgotPasswordCard
 * Ultra-Premium Split-Card Account Recovery for Devotees and Purohits.
 * 100% Flexbox, pure solid white canvas, radiant Haldi gold trims, zero grids, zero gradients.
 */
export const ForgotPasswordCard: React.FC<ForgotPasswordCardProps> = ({
  defaultRole = "USER",
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get("role")?.toUpperCase();
  const initialRole =
    queryRole === "PRIEST" || queryRole === "USER" ? queryRole : defaultRole;

  const [activeRole, setActiveRole] = useState<"USER" | "PRIEST">(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPriest = activeRole === "PRIEST";

  const roleConfig = {
    USER: {
      title: "Devotee Account Recovery",
      subtitle:
        "Enter your registered email to receive an authentic OTP reset code.",
      badge: "Devotee Sanctum",
      login: "/user/login",
      reset: "/user/reset-password",
      panelBg: "bg-[#780016]",
      quote:
        "सत्येन लभ्यस्तपसा ह्येष आत्मा — Truth and discipline reveal sacred purpose.",
      source: "Mundaka Upanishad",
    },
    PRIEST: {
      title: "Purohit Account Recovery",
      subtitle:
        "Enter your registered Acharya email to restore access to your ceremony calendar.",
      badge: "Purohit Sanctum",
      login: "/priest/login",
      reset: "/priest/reset-password",
      panelBg: "bg-[#780016]",
      quote:
        "विद्या ददाति विनयं विनयाद्याति पात्रताम् — True knowledge bestows humility and spiritual worth.",
      source: "Hitopadesha",
    },
  }[activeRole];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const watchEmail = watch("email");
  const isFormValid = Boolean(watchEmail?.trim());

  const handleRoleChange = (newRole: "USER" | "PRIEST") => {
    setActiveRole(newRole);
    setError(null);
    reset({
      email: "",
    });
  };

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: data.email.trim().toLowerCase() });
      if (res.success) {
        toast.info(`Recovery OTP sent to ${data.email}.`);
        navigate(`${roleConfig.reset}?email=${encodeURIComponent(data.email.trim().toLowerCase())}`);
      } else {
        setError(res.message || "Failed to dispatch recovery code. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center py-8 sm:py-12 px-4 text-stone-900">
      <div className="w-full max-w-4xl rounded-xl border-2 border-amber-300 bg-white shadow-xl overflow-hidden flex flex-col lg:flex-row items-stretch">
        {/* Left Showcase Panel */}
        <div
          className={`hidden lg:flex flex-col justify-between w-5/12 ${roleConfig.panelBg} text-white p-8 sm:p-10 border-r-2 border-amber-400/40 relative`}
        >
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
                  Account Recovery
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{roleConfig.badge}</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-white leading-snug">
                Secure Sanctum Credential Recovery
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Protecting devotee privacy and Purohit portal security. We will
                dispatch a 6-digit verification code to your registered email
                address.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Encrypted Security Verification</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Instant 6-Digit One-Time Password</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Seamless Session Restoration</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-amber-400/30 space-y-1">
            <div className="text-xs font-serif text-amber-200 italic">
              “{roleConfig.quote}”
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              — {roleConfig.source}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 bg-white flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <AuthRoleTabs
                activeRole={activeRole}
                onRoleChange={handleRoleChange}
                className="mb-0 w-full sm:w-auto"
              />
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold font-serif text-stone-900">
                {roleConfig.title}
              </h1>
              <p className="text-xs text-stone-600 leading-relaxed">
                {roleConfig.subtitle}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-800">
                  Registered Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    className="pl-10 text-xs h-11 rounded-md border-amber-300 focus-visible:ring-red-700"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-700 font-semibold">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="w-full text-xs font-bold bg-[#780016] hover:bg-[#5a0010] text-white h-11 rounded-md shadow-md cursor-pointer gap-2 disabled:opacity-50"
                >
                  {isLoading ? "Sending Reset Code..." : "Send Recovery Code"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          <div className="pt-6 text-center text-xs text-stone-600">
            <Link
              to={roleConfig.login}
              className="text-[#780016] font-bold hover:underline"
            >
              ← Return to {isPriest ? "Purohit" : "Devotee"} Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordCard;
