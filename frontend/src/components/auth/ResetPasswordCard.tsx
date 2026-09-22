import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordInput } from "@/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";

export interface ResetPasswordCardProps {
  role: "USER" | "PRIEST";
  loginPath: string;
}

/**
 * ResetPasswordCard
 * Ultra-Premium Split-Card Password Reset for Devotees and Purohits.
 * 100% Flexbox, pure solid white canvas, radiant Haldi gold trims, zero grids, zero gradients.
 */
export const ResetPasswordCard: React.FC<ResetPasswordCardProps> = ({
  role,
  loginPath,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPriest = role === "PRIEST";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchOtp = watch("otp");
  const watchNewPassword = watch("newPassword");
  const watchConfirmPassword = watch("confirmPassword");

  const isFormValid = Boolean(
    email.trim() &&
    watchOtp?.trim().length === 6 &&
    watchNewPassword &&
    watchNewPassword.length >= 6 &&
    watchConfirmPassword &&
    watchConfirmPassword === watchNewPassword &&
    !isSubmitting
  );

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!email.trim()) {
      setError("Please provide your registered account email address.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      });

      if (res.success) {
        toast.success("Password updated successfully! Please sign in with your new passkey.");
        navigate(loginPath);
      } else {
        setError(res.message || "Failed to update password. Please check your verification code.");
      }
    } catch {
      setError("An unexpected error occurred while resetting your credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center py-8 sm:py-12 px-4 text-stone-900">
      <div className="w-full max-w-4xl rounded-xl border-2 border-amber-300 bg-white shadow-xl overflow-hidden flex flex-col lg:flex-row items-stretch">
        {/* Left Showcase Panel */}
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
                  Credential Security
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isPriest ? "Purohit Sanctum" : "Devotee Sanctum"}</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-white leading-snug">
                Establish Your New Portal Passkey
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Enter your 6-digit verification code sent to your email,
                followed by a secure new password for your account.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Minimum 6 Characters Security Standard</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Immediate Session Unlocking</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-amber-400/30 space-y-1">
            <div className="text-xs font-serif text-amber-200 italic">
              “धर्मो रक्षति रक्षितः — Dharma protects those who protect it.”
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              — Mahabharata
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 bg-white flex flex-col justify-between relative">
          <div>
            {/* Top Row: Role Indicator Badge */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-100/70 border border-amber-300 text-xs font-bold text-[#780016]">
                <span className="font-serif font-black">
                  {isPriest ? "ॐ" : "👤"}
                </span>
                <span>
                  {isPriest ? "Purohit Passkey Reset" : "Devotee Passkey Reset"}
                </span>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold font-serif text-stone-900">
                Set New Password
              </h1>
              <p className="text-xs text-stone-600 leading-relaxed">
                Enter the verification code received on your email and your new credentials.
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="acharya@example.com"
                    className="pl-10 text-xs h-11 rounded-md border-amber-300 focus-visible:ring-red-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-800">
                  Recovery OTP (6 Digits)
                </Label>
                <Input
                  maxLength={6}
                  placeholder="123456"
                  {...register("otp")}
                  className="font-mono text-center tracking-widest text-sm h-11 rounded-md border-amber-300 focus-visible:ring-red-700"
                />
                {errors.otp && (
                  <p className="text-[11px] text-red-700 font-semibold">
                    {errors.otp.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-800">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    {...register("newPassword")}
                    className="pl-10 pr-10 text-xs h-11 rounded-md border-amber-300 focus-visible:ring-red-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-[11px] text-red-700 font-semibold">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-800">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    {...register("confirmPassword")}
                    className="pl-10 pr-10 text-xs h-11 rounded-md border-amber-300 focus-visible:ring-red-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-red-700 font-semibold">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="w-full text-xs font-bold bg-[#780016] hover:bg-[#5a0010] text-white h-11 rounded-md shadow-md cursor-pointer gap-2 disabled:opacity-50"
                >
                  <span>{isSubmitting ? "Updating Passkey..." : "Update Password & Sign In"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          <div className="pt-6 text-center text-xs text-stone-600">
            <Link
              to={loginPath}
              className="text-[#780016] font-bold hover:underline"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordCard;
