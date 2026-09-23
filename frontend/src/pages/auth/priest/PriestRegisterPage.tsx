import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerPriestPersonalSchema,
  RegisterPriestPersonalInput,
} from "@/schemas/auth.schema";
import { authApi } from "@/api/auth.api";
import { addressApi, PincodeLocation } from "@/api/address.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthRoleTabs } from "@/components/auth/AuthRoleTabs";
import {
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

/**
 * PriestRegisterPage
 * Premium Split-Card Multi-Step Vedic Purohit Registration Form
 * Matches the rich aesthetic of AuthLoginForm & UserRegisterPage:
 * - Left Showcase Panel (Deep Sanctum Maroon `#450A0A`) with sacred priest commitments & Sanskrit shloka
 * - Right Form Panel with integrated AuthRoleTabs, step indicators, and form flow
 * - 100% Flexbox, zero CSS Grids, pure solid colors, Haldi gold trims
 */
export const PriestRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step progress (1: Credentials, 2: OTPs, 3: Vedic Samhita/City, 4: Submitted)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Form with React Hook Form + Zod
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<RegisterPriestPersonalInput>({
    resolver: zodResolver(registerPriestPersonalSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      password: "",
    },
  });

  const watchFullName = watch("fullName");
  const watchPhone = watch("phoneNumber");
  const watchEmail = watch("email");
  const watchPassword = watch("password");

  const isStep1Valid = Boolean(
    watchFullName?.trim() &&
    watchPhone?.trim() &&
    watchEmail?.trim() &&
    watchPassword &&
    watchPassword.length >= 6,
  );

  // Step 2: Verification state
  const [emailOtp, setEmailOtp] = useState("");
  const isStep2Valid = emailOtp.trim().length === 6;

  // Step 3: Vedic qualifications & Service city extraction
  const [experienceYears, setExperienceYears] = useState("5");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("West Bengal");
  const [locations, setLocations] = useState<PincodeLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<PincodeLocation | null>(null);
  const [isSearchingPin, setIsSearchingPin] = useState(false);

  const [languages, setLanguages] = useState<string[]>([
    "Sanskrit",
    "Hindi",
    "Bengali",
  ]);
  const [specializations, setSpecializations] = useState<string[]>([
    "Griha Pravesh",
    "Satyanarayan Katha",
    "Rudrabhishek",
  ]);
  const [bio, setBio] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStep3Valid = Boolean(
    pincode.trim().length === 6 && city.trim() && bio.trim() && !isSubmitting,
  );

  // Step 1: Submit Personal Details with email OTP dispatch
  const onPersonalSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { email } = getValues();
      await authApi.sendEmailOtp({ email });

      setStep(2);
      toast.info("Verification code dispatched to your email address.");
    } catch {
      setErrorMessage("Failed to dispatch verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit OTP Verification for email only
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (emailOtp.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit email verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const emailRes = await authApi.verifyEmailOtp({
        email: getValues().email,
        otp: emailOtp.trim(),
      });

      if (!emailRes.success) {
        setErrorMessage(emailRes.message || "Invalid email verification code.");
        return;
      }

      setStep(3);
      toast.success("Email verified successfully!");
    } catch {
      setErrorMessage("Verification failed. Please check your verification code and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend fresh dynamic OTP
  const handleResendOtp = async () => {
    try {
      const { email } = getValues();
      await authApi.sendEmailOtp({ email });

      toast.info("Fresh verification code dispatched to your email.");
    } catch {
      toast.error("Failed to resend verification code.");
    }
  };

  // Step 3: Auto-detect City from PIN Code
  const handleLookupPin = async (pinToSearch: string) => {
    const cleanPin = pinToSearch.trim().replace(/\D/g, "");
    if (cleanPin.length !== 6) return;

    setIsSearchingPin(true);
    try {
      const res = await addressApi.lookupPincode(cleanPin);
      setLocations(res.locations);
      if (res.locations.length > 0) {
        setSelectedLocation(res.locations[0]);
        setCity(res.locations[0].city);
        setState(res.locations[0].state);
      }
    } catch {
      toast.error("Could not fetch PIN details. Enter service base manually.");
    } finally {
      setIsSearchingPin(false);
    }
  };

  // Step 3: Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!bio.trim() || !city.trim() || !pincode.trim()) {
      setErrorMessage("Please provide your service PIN code and Vedic bio.");
      return;
    }

    const personal = getValues();
    setIsSubmitting(true);
    try {
      const res = await authApi.registerPriest({
        fullName: personal.fullName,
        phoneNumber: personal.phoneNumber,
        email: personal.email,
        password: personal.password,
        bio: bio.trim(),
        city: city.trim(),
        state: state.trim() || "West Bengal",
        pincode: pincode.trim(),
        languages,
        specializations,
      });

      if (res.success) {
        setStep(4);
        toast.success("Purohit application submitted for review!");
      } else {
        setErrorMessage(
          res.message ||
            "Application submission failed. Please check your details.",
        );
      }
    } catch {
      setErrorMessage("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-4xl rounded-xl border-2 border-amber-300 bg-white shadow-xl overflow-hidden flex flex-col lg:flex-row items-stretch">
        {/* Left Showcase Panel (Desktop Only, 100% Flexbox, Solid Sacred Vermilion `#780016`) */}
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-[#780016] text-white p-8 sm:p-10 border-r-2 border-amber-400/40 relative">
          <div className="space-y-6">
            {/* Top Brand Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-md bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-black text-2xl shadow-md select-none">
                ॐ
              </div>
              <div>
                <div className="font-serif font-black text-lg tracking-wider text-amber-300">
                  PUJACIRCLE
                </div>
                <div className="text-[10px] text-amber-100 uppercase tracking-widest font-semibold">
                  Vedic Purohit Sanctum
                </div>
              </div>
            </div>

            {/* Headline & Value Propositions */}
            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Purohit Application</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-white leading-snug">
                Serve Devotees with Sacred Dignity & Honor
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Join India's premier network of Gurukul-trained Vedic scholars.
                Conduct home ceremonies with utmost reverence, choose your
                preferred locality, and receive 100% direct cash dakshina.
              </p>
            </div>

            {/* Sacred Commitments */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>100% Direct Cash Dakshina Kept by Priest (0% Fee)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Full Schedule Freedom & Local Area Radius</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Verified Devotees with Direct Phone Coordination</span>
              </div>
            </div>

            {/* Stepper Progress Indicator on Left Panel */}
            <div className="p-3.5 rounded-md bg-black/25 border border-amber-400/30 space-y-2 pt-3">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Application Progress
              </div>
              <div className="space-y-1.5 text-xs">
                <div
                  className={`flex items-center gap-2 ${step >= 1 ? "text-amber-200 font-bold" : "text-amber-200/50"}`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${step > 1 ? "bg-amber-400 text-stone-950 font-bold" : step === 1 ? "border border-amber-400 text-amber-300" : "border border-amber-400/40 text-amber-200/50"}`}
                  >
                    {step > 1 ? "✓" : "1"}
                  </span>
                  <span>Acharya Identity & Contacts</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${step >= 2 ? "text-amber-200 font-bold" : "text-amber-200/50"}`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${step > 2 ? "bg-amber-400 text-stone-950 font-bold" : step === 2 ? "border border-amber-400 text-amber-300" : "border border-amber-400/40 text-amber-200/50"}`}
                  >
                    {step > 2 ? "✓" : "2"}
                  </span>
                  <span>Contact Verification (OTP)</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${step >= 3 ? "text-amber-200 font-bold" : "text-amber-200/50"}`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${step > 3 ? "bg-amber-400 text-stone-950 font-bold" : step === 3 ? "border border-amber-400 text-amber-300 font-bold" : "border border-amber-400/40 text-amber-200/50"}`}
                  >
                    {step > 3 ? "✓" : "3"}
                  </span>
                  <span>Vedic Samhita & Qualifications</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${step === 4 ? "text-amber-200 font-bold" : "text-amber-200/50"}`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? "bg-amber-400 text-stone-950 font-bold" : "border border-amber-400/40 text-amber-200/50"}`}
                  >
                    {step === 4 ? "✓" : "4"}
                  </span>
                  <span>Submitted for Review</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sanskrit Quote */}
          <div className="pt-6 border-t border-amber-400/30 space-y-1">
            <div className="text-xs font-serif text-amber-200 italic">
              “विद्वत्वं च नृपत्वं च नैव तुल्यं कदाचन — Wisdom and sacred
              knowledge surpass all royalty.”
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              — Chanakya Niti
            </div>
          </div>
        </div>

        {/* Right Form Panel (Flexbox) */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 bg-white flex flex-col justify-between relative">
          <div>
            {/* Top Row: Role Switch Tabs */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <AuthRoleTabs
                activeRole="PRIEST"
                onRoleChange={(role) => {
                  if (role === "USER") navigate("/user/register");
                }}
                className="mb-0 w-full sm:w-auto"
              />
            </div>

            {/* Header Block with Step Tracker */}
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold font-serif text-stone-900">
                {step === 4
                  ? "Application Received"
                  : "Apply as a Vedic Purohit"}
              </h1>
              <p className="text-xs text-stone-600 leading-relaxed">
                {step === 4
                  ? "Status: Pending Administrator Approval"
                  : `Step ${step} of 3 • ${
                      step === 1
                        ? "Personal Details"
                        : step === 2
                          ? "Email Verification"
                          : "Vedic Qualifications & City"
                    }`}
              </p>

              {/* Progress Stepper Bar */}
              {step < 4 && (
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        step >= 1
                          ? "bg-[#780016] text-white"
                          : "bg-stone-100 text-stone-500 border border-stone-300"
                      }`}
                    >
                      {step > 1 ? "✓" : "1"}
                    </div>
                    <span className="text-xs font-semibold text-stone-700">
                      Identity
                    </span>
                  </div>

                  <div
                    className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-[#780016]" : "bg-stone-200"}`}
                  />

                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        step >= 2
                          ? "bg-[#780016] text-white"
                          : "bg-stone-100 text-stone-500 border border-stone-300"
                      }`}
                    >
                      {step > 2 ? "✓" : "2"}
                    </div>
                    <span className="text-xs font-semibold text-stone-700">
                      Verify
                    </span>
                  </div>

                  <div
                    className={`h-1 flex-1 rounded-full ${step >= 3 ? "bg-[#780016]" : "bg-stone-200"}`}
                  />

                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        step >= 3
                          ? "bg-[#780016] text-white"
                          : "bg-stone-100 text-stone-500 border border-stone-300"
                      }`}
                    >
                      3
                    </div>
                    <span className="text-xs font-semibold text-stone-700">
                      Vidhi
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ================= STEP 1: Personal Info ================= */}
            {step === 1 && (
              <form
                onSubmit={handleSubmit(onPersonalSubmit)}
                className="space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-stone-800">
                      Full Name & Vedic Title
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
                      <Input
                        placeholder="e.g. Pandit Radhe Shyam Shastri"
                        {...register("fullName")}
                        className="pl-10 text-xs h-11 rounded-md border-amber-300 focus-visible:ring-red-700"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-[11px] text-red-700 font-semibold">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-stone-800">
                      Mobile Number (+91)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
                      <Input
                        type="tel"
                        placeholder="+91 98765 43211"
                        {...register("phoneNumber")}
                        className="pl-10 text-xs h-11 rounded-md border-amber-300 focus-visible:ring-red-700"
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-[11px] text-red-700 font-semibold">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-stone-800">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
                      <Input
                        type="email"
                        placeholder="purohit@example.com"
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-stone-800">
                      Portal Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        {...register("password")}
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
                    {errors.password && (
                      <p className="text-[11px] text-red-700 font-semibold">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={!isStep1Valid}
                    className="w-full text-xs font-bold bg-[#780016] hover:bg-[#600012] text-white h-11 rounded-md shadow-md cursor-pointer gap-2 disabled:opacity-50"
                  >
                    <span>Continue to Verification</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </form>
            )}

            {/* ================= STEP 2: Email OTP ================= */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-stone-800">
                        Email Verification Code
                      </Label>
                      <span className="text-[10px] text-stone-500 font-medium">
                        Sent to {getValues("email")}
                      </span>
                    </div>
                    <Input
                      maxLength={6}
                      placeholder="Enter 6-digit email OTP"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className="font-mono text-center tracking-widest text-sm h-11 rounded-md border-amber-300 focus-visible:ring-red-700"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[11px] font-semibold text-[#780016] hover:underline cursor-pointer"
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 h-10 px-4 rounded-md border-2 border-amber-300 text-stone-800 hover:bg-amber-50 cursor-pointer"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!isStep2Valid}
                    className="text-xs font-bold bg-[#780016] hover:bg-[#600012] text-white h-10 px-5 rounded-md shadow-md cursor-pointer gap-1 disabled:opacity-50"
                  >
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </form>
            )}

            {/* ================= STEP 3: Qualifications & Service Locality ================= */}
            {step === 3 && (
              <form onSubmit={handleSubmitApplication} className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-800">
                    Vedic Experience (Years)
                  </Label>
                  <Input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="text-xs h-10 rounded-md border-amber-300 focus-visible:ring-red-700"
                    required
                  />
                </div>

                {/* Service Base PIN Code */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-stone-800">
                      Service Base PIN Code (Extracts City)
                    </Label>
                    {isSearchingPin && (
                      <span className="text-[10px] text-red-700 animate-pulse font-bold">
                        Detecting city...
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPincode(val);
                        if (val.length === 6) {
                          handleLookupPin(val);
                        }
                      }}
                      placeholder="e.g. 700019, 560038, 400050"
                      className="text-xs font-mono h-10 rounded-md border-amber-300 focus-visible:ring-red-700 flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0 h-10 px-3.5 rounded-md border-2 border-amber-300 text-stone-800 hover:bg-amber-50 cursor-pointer font-bold"
                      onClick={() => handleLookupPin(pincode)}
                      disabled={isSearchingPin || pincode.length < 6}
                    >
                      {isSearchingPin ? "Detecting..." : "Find City"}
                    </Button>
                  </div>
                </div>

                {/* Localities Dropdown */}
                {locations.length > 0 && (
                  <div className="space-y-1.5 p-2.5 rounded-md bg-amber-50 border border-amber-300">
                    <Label className="text-xs font-bold text-stone-900">
                      Primary Service Locality ({locations.length} areas found)
                    </Label>
                    <select
                      className="w-full text-xs p-2 rounded-md border border-amber-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700 font-medium"
                      value={selectedLocation?.postOffice}
                      onChange={(e) => {
                        const match = locations.find(
                          (l) => l.postOffice === e.target.value,
                        );
                        if (match) {
                          setSelectedLocation(match);
                          setCity(match.city);
                          setState(match.state);
                        }
                      }}
                    >
                      {locations.map((loc, idx) => (
                        <option key={idx} value={loc.postOffice}>
                          {loc.postOffice} • {loc.city}, {loc.state}
                        </option>
                      ))}
                    </select>

                    <div className="pt-0.5 flex flex-wrap gap-1.5 text-[10px] text-stone-700 font-medium">
                      <span className="bg-white px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 text-red-700" /> City:{" "}
                        <strong className="text-stone-900">{city}</strong>
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded border border-amber-200">
                        State:{" "}
                        <strong className="text-stone-900">{state}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Languages Spoken Tags */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-800">
                    Languages Spoken
                  </Label>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      "Sanskrit",
                      "Hindi",
                      "Marathi",
                      "Bengali",
                      "Kannada",
                      "Tamil",
                      "Telugu",
                      "Gujarati",
                    ].map((lang) => {
                      const checked = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setLanguages(
                              checked
                                ? languages.filter((l) => l !== lang)
                                : [...languages, lang],
                            );
                          }}
                          className={`px-2.5 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors ${
                            checked
                              ? "bg-[#780016] text-white border border-amber-400"
                              : "bg-white text-stone-700 border border-stone-300 hover:border-amber-400"
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specializations Tags */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-800">
                    Vedic Specializations
                  </Label>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      "Griha Pravesh",
                      "Satyanarayan Katha",
                      "Rudrabhishek",
                      "Vivah Sanskar",
                      "Navagraha Havan",
                      "Vastu Shanti",
                    ].map((spec) => {
                      const checked = specializations.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => {
                            setSpecializations(
                              checked
                                ? specializations.filter((s) => s !== spec)
                                : [...specializations, spec],
                            );
                          }}
                          className={`px-2.5 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors ${
                            checked
                              ? "bg-[#780016] text-white border border-amber-400"
                              : "bg-white text-stone-700 border border-stone-300 hover:border-amber-400"
                          }`}
                        >
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bio / Gurukul Lineage */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-800">
                    Gurukul Lineage & Bio
                  </Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="text-xs rounded-md border-amber-300 focus-visible:ring-red-700"
                    placeholder="Describe your Vedic study and samhita lineage..."
                    required
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 h-10 px-4 rounded-md border-2 border-amber-300 text-stone-800 hover:bg-amber-50 cursor-pointer"
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!isStep3Valid || isSubmitting}
                    className="text-xs font-bold bg-[#780016] hover:bg-[#600012] text-white h-10 px-5 rounded-md shadow-md cursor-pointer gap-1 disabled:opacity-50"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </span>
                  </Button>
                </div>
              </form>
            )}

            {/* ================= STEP 4: PENDING APPROVAL CONFIRMATION ================= */}
            {step === 4 && (
              <div className="py-4 space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-amber-100 text-amber-700 border-2 border-amber-300 shadow-md">
                  <Clock className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
                    <span>Status: PENDING ADMIN APPROVAL</span>
                  </div>
                  <h3 className="text-xl font-bold font-serif text-stone-900">
                    Application Successfully Received!
                  </h3>
                  <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                    Thank you, Pandit {getValues("fullName")}. Your Vedic
                    qualifications and service location in{" "}
                    <strong className="text-stone-900">
                      {city}, {state}
                    </strong>{" "}
                    have been received. Once verified by our sanctum team, your
                    Purohit Workspace and ceremony calendar will be unlocked.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 max-w-xs mx-auto">
                  <Link to="/priest/login" className="block w-full">
                    <Button className="w-full text-xs font-bold bg-[#780016] hover:bg-[#600012] text-white h-10 rounded-md shadow-md cursor-pointer">
                      Return to Priest Sign In
                    </Button>
                  </Link>
                  <Link to="/" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full text-xs h-10 rounded-md border-2 border-amber-300 text-stone-800 hover:bg-amber-50 cursor-pointer"
                    >
                      Go to PujaCircle Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Switch to Sign In */}
          {step < 4 && (
            <div className="pt-6 text-center text-xs text-stone-600">
              Already registered as a Purohit?{" "}
              <Link
                to="/priest/login"
                className="text-[#780016] font-bold hover:underline"
              >
                Sign In to Purohit Portal →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriestRegisterPage;
