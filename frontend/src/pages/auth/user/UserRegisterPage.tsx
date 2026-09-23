import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerUserPersonalSchema,
  RegisterUserPersonalInput,
} from "@/schemas/auth.schema";
import { authApi } from "@/api/auth.api";
import { addressApi, PincodeLocation } from "@/api/address.api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

/**
 * UserRegisterPage
 * Premium Split-Card Multi-Step Devotee Registration Form
 * Matches the rich aesthetic of AuthLoginForm:
 * - Left Showcase Panel (Deep Vermilion `#780016`) with sacred promises & Sanskrit quote
 * - Right Form Panel with integrated AuthRoleTabs, step indicators, and form flow
 * - 100% Flexbox, zero CSS Grids, pure solid colors, Haldi gold trims
 */
export const UserRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Personal info form with React Hook Form + Zod
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<RegisterUserPersonalInput>({
    resolver: zodResolver(registerUserPersonalSchema),
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

  // Step 2: OTP verification state (Email OTP only)
  const [emailOtp, setEmailOtp] = useState("");
  const isStep2Valid = emailOtp.trim().length === 6;

  // Step 3: Address setup state
  const [pincode, setPincode] = useState("");
  const [locations, setLocations] = useState<PincodeLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<PincodeLocation | null>(null);
  const [houseBuilding, setHouseBuilding] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isSearchingPin, setIsSearchingPin] = useState(false);

  const isStep3Valid =
    pincode.trim().length === 6 &&
    houseBuilding.trim().length > 0 &&
    street.trim().length > 0;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Proceed to Email OTP verification
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

  // Step 2: Validate Email OTP
  const handleVerifyOtpStep = async (e: React.FormEvent) => {
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

  // Resend fresh email OTP
  const handleResendOtp = async () => {
    try {
      const { email } = getValues();
      await authApi.sendEmailOtp({ email });

      toast.info("Fresh verification code dispatched to your email.");
    } catch {
      toast.error("Failed to resend verification code.");
    }
  };

  // Step 3: PIN Code Lookup
  const handleLookupPin = async (pinToSearch: string) => {
    const cleanPin = pinToSearch.trim().replace(/\D/g, "");
    if (cleanPin.length !== 6) return;

    setIsSearchingPin(true);
    try {
      const res = await addressApi.lookupPincode(cleanPin);
      setLocations(res.locations);
      if (res.locations.length > 0) {
        setSelectedLocation(res.locations[0]);
      }
    } catch {
      toast.error("Could not auto-fetch PIN details. Please fill manually.");
    } finally {
      setIsSearchingPin(false);
    }
  };

  // Step 3: Complete registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedLocation && locations.length === 0 && pincode.length !== 6) {
      setErrorMessage("Please provide a valid 6-digit PIN code.");
      return;
    }

    setIsSubmitting(true);
    const personalData = getValues();

    try {
      const res = await authApi.registerUser({
        fullName: personalData.fullName,
        email: personalData.email,
        phoneNumber: personalData.phoneNumber,
        password: personalData.password,
        address: {
          houseNo: houseBuilding,
          street: street,
          locality: selectedLocation
            ? selectedLocation.postOffice
            : "Central Locality",
          villageTown: selectedLocation
            ? selectedLocation.villageTown
            : "Kolkata",
          city: selectedLocation ? selectedLocation.city : "Kolkata",
          district: selectedLocation ? selectedLocation.district : "Kolkata",
          state: selectedLocation ? selectedLocation.state : "West Bengal",
          pincode: pincode,
        },
      });

      if (res.success && res.data?.user) {
        if (res.data.token) {
          setToken(res.data.token);
        }
        setUser(res.data.user);
        toast.success("Registration successful! Welcome to PujaCircle.");
        navigate("/user/home");
      } else {
        setErrorMessage(
          res.message || "Registration failed. Please try again.",
        );
      }
    } catch {
      setErrorMessage(
        "Failed to complete registration. Please check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-4xl rounded-xl border-2 border-amber-300 bg-white shadow-xl overflow-hidden flex flex-col lg:flex-row items-stretch">
        {/* Left Showcase Panel (Desktop Only, 100% Flexbox, Solid Vermilion `#780016`) */}
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
                  Sacred Vedic Sanctum
                </div>
              </div>
            </div>

            {/* Headline & Value Propositions */}
            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Devotee Registration</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-white leading-snug">
                Join 25,000+ Devotee Families Across India
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Create your devotee sanctum in under two minutes. Experience
                traditional rituals with verified Gurukul-trained Purohits,
                transparent muhurat schedules, and direct cash dakshina.
              </p>
            </div>

            {/* Sacred Commitments */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>1,200+ Verified Gurukul Scholars</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>100% Direct Cash Dakshina to Priest</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Zero Advance Fees & Instant Muhurats</span>
              </div>
            </div>

            {/* Stepper Progress Indicator on Left Panel */}
            <div className="p-3.5 rounded-md bg-black/25 border border-amber-400/30 space-y-2 pt-3">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Registration Progress
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
                  <span>Personal Credentials</span>
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
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? "border border-amber-400 text-amber-300 font-bold" : "border border-amber-400/40 text-amber-200/50"}`}
                  >
                    3
                  </span>
                  <span>Sanctum Home Address</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sanskrit Quote */}
          <div className="pt-6 border-t border-amber-400/30 space-y-1">
            <div className="text-xs font-serif text-amber-200 italic">
              “यज्ञो वै श्रेष्ठतमं कर्म — Yajna is the highest auspicious deed.”
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              — Satapatha Brahmana
            </div>
          </div>
        </div>

        {/* Right Form Panel (Flexbox) */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 bg-white flex flex-col justify-between relative">
          <div>
            {/* Top Row: Role Switch Tabs */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <AuthRoleTabs
                activeRole="USER"
                onRoleChange={(role) => {
                  if (role === "PRIEST") navigate("/priest/register");
                }}
                className="mb-0 w-full sm:w-auto"
              />
            </div>

            {/* Header Block with Step Tracker */}
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold font-serif text-stone-900">
                Create Devotee Account
              </h1>
              <p className="text-xs text-stone-600 leading-relaxed">
                Step {step} of 3 •{" "}
                {step === 1
                  ? "Personal Credentials"
                  : step === 2
                    ? "Mobile & Email Verification"
                    : "Primary Puja Sanctum Address"}
              </p>

              {/* Progress Stepper Bar */}
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
                    Details
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
                    Sanctum
                  </span>
                </div>
              </div>
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
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-500" />
                      <Input
                        placeholder="e.g. Ramesh Chandra Sharma"
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
                        placeholder="+91 98765 43210"
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
                        placeholder="you@example.com"
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
                      Password
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
              <form onSubmit={handleVerifyOtpStep} className="space-y-4">
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
                    className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                  >
                    Didn't receive codes? Resend OTP
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

            {/* ================= STEP 3: Mandatory Home Address ================= */}
            {step === 3 && (
              <form
                onSubmit={handleCompleteRegistration}
                className="space-y-3.5"
              >
                <div className="p-2.5 bg-emerald-50 rounded-md border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  <span>
                    Contacts verified! Set your primary sanctum address for
                    ceremony muhurats.
                  </span>
                </div>

                {/* PIN Code Lookup */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-stone-800">
                      PIN Code (Auto-detects Locality)
                    </Label>
                    {isSearchingPin && (
                      <span className="text-[10px] text-red-700 animate-pulse font-bold">
                        Detecting area...
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
                      placeholder="Enter 6-digit PIN Code"
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
                      {isSearchingPin ? "Searching..." : "Find Area"}
                    </Button>
                  </div>
                </div>

                {/* Location Select (if multiple locations returned) */}
                {locations.length > 0 && (
                  <div className="space-y-1.5 p-2.5 rounded-md bg-amber-50 border border-amber-300">
                    <Label className="text-xs font-bold text-stone-900">
                      Select Locality ({locations.length} found)
                    </Label>
                    <select
                      className="w-full text-xs p-2 rounded-md border border-amber-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700 font-medium"
                      value={selectedLocation?.postOffice}
                      onChange={(e) => {
                        const match = locations.find(
                          (l) => l.postOffice === e.target.value,
                        );
                        if (match) setSelectedLocation(match);
                      }}
                    >
                      {locations.map((loc, idx) => (
                        <option key={idx} value={loc.postOffice}>
                          {loc.postOffice} • {loc.city}, {loc.state}
                        </option>
                      ))}
                    </select>

                    {selectedLocation && (
                      <div className="pt-0.5 flex flex-wrap gap-1.5 text-[10px] text-stone-700 font-medium">
                        <span className="bg-white px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 text-red-700" /> City:{" "}
                          <strong className="text-stone-900">
                            {selectedLocation.city}
                          </strong>
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-amber-200">
                          State:{" "}
                          <strong className="text-stone-900">
                            {selectedLocation.state}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* House / Flat / Building */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-800">
                    House / Flat / Building
                  </Label>
                  <Input
                    placeholder="e.g. Flat 402, Ganga Heights"
                    value={houseBuilding}
                    onChange={(e) => setHouseBuilding(e.target.value)}
                    className="text-xs h-10 rounded-md border-amber-300 focus-visible:ring-red-700"
                    required
                  />
                </div>

                {/* Street / Road */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-800">
                    Street / Road / Colony
                  </Label>
                  <Input
                    placeholder="e.g. Rashbehari Avenue"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="text-xs h-10 rounded-md border-amber-300 focus-visible:ring-red-700"
                    required
                  />
                </div>

                {/* Landmark */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-stone-800">
                    Landmark (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. Near Lake Mall"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="text-xs h-10 rounded-md border-amber-300 focus-visible:ring-red-700"
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
                    className="text-xs font-bold bg-[#780016] hover:bg-[#600012] text-white h-10 px-5 rounded-md shadow-md cursor-pointer gap-1 disabled:opacity-50"
                    disabled={isSubmitting || !isStep3Valid}
                  >
                    {isSubmitting
                      ? "Creating Account..."
                      : "Complete & Sign In"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Bottom Switch to Sign In */}
          <div className="pt-6 text-center text-xs text-stone-600">
            Already have an account?{" "}
            <Link
              to="/user/login"
              className="text-[#780016] font-bold hover:underline"
            >
              Sign In to Devotee Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegisterPage;
