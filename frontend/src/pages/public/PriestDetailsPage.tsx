import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { priestApi } from "@/api/priest.api";
import { addressApi } from "@/api/address.api";
import { bookingApi } from "@/api/booking.api";
import { Priest, PriestService } from "@/types/priest.types";
import { CalculatedSlot } from "@/lib/availabilityUtils";
import { Address } from "@/types/address.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatTime, formatFullDate } from "@/lib/utils";
import {
  Sparkles,
  MapPin,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowLeft,
  Check,
  AlertCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

export const PriestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [priest, setPriest] = useState<Priest | null>(null);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date & Dynamic Slot Picker
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [availableSlots, setAvailableSlots] = useState<CalculatedSlot[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);

  // Booking Flow State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PriestService | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<CalculatedSlot | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [userNotes, setUserNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPriestAndAddresses() {
      if (!id) return;
      setIsLoading(true);
      try {
        const priestData = await priestApi.getPriestById(id);
        if (priestData) {
          setPriest(priestData);
          if (priestData.services && priestData.services.length > 0) {
            setSelectedService(priestData.services[0]);
          }
        }

        if (user) {
          const addrs = await addressApi.getAddresses(user.id);
          setUserAddresses(addrs);
          const priestCity = priestData?.city?.trim().toLowerCase();
          const matchingAddrs = priestCity
            ? addrs.filter((a) => a.city?.trim().toLowerCase() === priestCity)
            : addrs;
          const defaultAddr =
            matchingAddrs.find((a) => a.isDefault) || matchingAddrs[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        }
      } catch {
        toast.error("Failed to load priest profile.");
      } finally {
        setIsLoading(false);
      }
    }
    loadPriestAndAddresses();
  }, [id, user]);

  // Load generated slots whenever selectedDate or priest changes
  useEffect(() => {
    async function loadSlots() {
      if (!id) return;
      setIsSlotsLoading(true);
      try {
        const slots = await priestApi.getAvailableSlotsForDate(
          id,
          selectedDate,
        );
        setAvailableSlots(slots);
      } catch {
        toast.error("Failed to load slots for this date.");
      } finally {
        setIsSlotsLoading(false);
      }
    }
    loadSlots();
  }, [id, selectedDate]);

  const handleStartBooking = (service?: PriestService, slot?: CalculatedSlot) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to schedule an appointment with this Priest.");
      navigate("/user/login");
      return;
    }
    if (service) setSelectedService(service);
    if (slot) setSelectedSlot(slot);
    setIsBookingOpen(true);
  };

  const handleSubmitBooking = async () => {
    if (
      !user ||
      !priest ||
      !selectedSlot ||
      !selectedAddressId ||
      !selectedService
    ) {
      toast.error("Please select a service, address, and available time slot.");
      return;
    }

    const selectedAddress = userAddresses.find(
      (a) => a.id === selectedAddressId,
    );
    if (
      priest.city &&
      selectedAddress &&
      selectedAddress.city.trim().toLowerCase() !==
        priest.city.trim().toLowerCase()
    ) {
      toast.error(
        `This priest only conducts ceremonies in ${priest.city}. Please choose an address in ${priest.city}.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bookingApi.createBooking(
        {
          priestId: priest.id,
          priestServiceId: selectedService.id,
          slotId: selectedSlot.id,
          availabilitySlotId: selectedSlot.id,
          addressId: selectedAddressId,
          bookingDate:
            selectedSlot.slotDate || selectedSlot.date || selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          userNotes,
        },
        user.id,
      );

      if (res.success && res.data) {
        toast.success(res.message);
        setIsBookingOpen(false);
        navigate(`/user/bookings/${res.data.id}`);
      } else {
        toast.error(res.message || "Failed to submit booking request.");
      }
    } catch {
      toast.error("Failed to submit booking request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 text-center text-xs text-muted-foreground">
        Loading Priest profile and services...
      </div>
    );
  }

  if (!priest) {
    return (
      <div className="container py-12 text-center space-y-4 max-w-md">
        <h2 className="text-xl font-bold font-serif">
          Priest Profile Not Found
        </h2>
        <p className="text-xs text-muted-foreground">
          The requested priest profile does not exist or is currently pending
          approval.
        </p>
        <Link to="/user/priests">
          <Button
            size="sm"
            variant="outline"
            className="border-2 border-amber-300 rounded-md hover:bg-amber-50"
          >
            ← Return to Priest Directory
          </Button>
        </Link>
      </div>
    );
  }

  const activeBookableSlots = availableSlots.filter(
    (s) => s.status === "AVAILABLE",
  );

  return (
    <div className="container py-6 sm:py-8 space-y-6 max-w-6xl">
      {/* Back Link */}
      <Link
        to="/user/priests"
        className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-red-700 font-bold transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 text-red-700" />
        <span>Back to Vedic Purohit Directory</span>
      </Link>

      {/* Priest Header Profile Card */}
      <div className="bg-white border border-amber-300/90 rounded-xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row gap-6 items-start relative">
        <div className="relative shrink-0 mx-auto md:mx-0">
          <img
            src={
              priest.profileImageUrl ||
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
            }
            alt={priest.fullName}
            className="h-28 w-28 sm:h-32 sm:w-32 rounded-md object-cover ring-2 ring-amber-400 ring-offset-2 shrink-0 bg-amber-50 shadow-sm"
          />
          <div
            className="absolute -bottom-1 -right-1 bg-red-700 text-white rounded-full p-1.5 shadow-sm border-2 border-white"
            title="Gurukul Lineage Verified"
          >
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
                  {priest.displayName || priest.fullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-sm bg-red-700 text-white text-xs font-semibold shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Vedic Verified</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1.5">
                <span className="inline-flex items-center gap-1 font-bold text-stone-900 bg-amber-100 px-2.5 py-0.5 rounded-sm border border-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {priest.rating ? priest.rating.toFixed(1) : "4.9"} (
                  {priest.reviewCount || 48} Reviews)
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-stone-900 bg-amber-400 px-2.5 py-0.5 rounded-sm">
                  <Clock className="h-3 w-3 text-stone-950" />
                  {priest.experienceYears}+ Yrs Shastric Exp
                </span>
                <span className="flex items-center gap-1 font-semibold text-stone-700">
                  <MapPin className="h-3.5 w-3.5 text-red-700" /> {priest.city},{" "}
                  {priest.state}
                </span>
              </div>
            </div>

            <Button
              onClick={() => handleStartBooking()}
              className="gap-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-md shadow-md h-11 px-5 cursor-pointer shrink-0"
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule Ceremony</span>
            </Button>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">{priest.bio}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-amber-100">
            <div>
              <span className="text-stone-500 font-medium">Languages: </span>
              <strong className="text-stone-900">
                {priest.languages?.join(", ") || "Hindi, Sanskrit"}
              </strong>
            </div>
            <span>•</span>
            <div>
              <span className="text-stone-500 font-medium">
                Serving Localities:{" "}
              </span>
              <strong className="text-stone-900">
                {priest.serviceAreas?.join(", ") || priest.city}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Services and Dynamic Slot Picker Layout (Flexbox Only, Zero Grids) */}
      <div className="flex flex-col md:flex-row items-start gap-6 w-full">
        {/* Left Column: Offered Services & Rates */}
        <div className="w-full md:w-[calc(58%-12px)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-700" />
              <span>Offered Ceremonies & Dakshina Rates</span>
            </h2>
            <span className="text-[11px] text-stone-500 font-semibold">
              Cash after puja
            </span>
          </div>

          <div className="space-y-3">
            {!priest.services || priest.services.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 border-2 border-dashed border-amber-300 bg-amber-50/40 rounded-md">
                This priest has not published specific service rates yet.
              </div>
            ) : (
              priest.services.map((srv) => (
                <div
                  key={srv.id}
                  className={`p-4 rounded-md border-2 cursor-pointer transition-all shadow-xs bg-white flex items-center justify-between gap-4 ${
                    selectedService?.id === srv.id
                      ? "border-red-700 ring-2 ring-red-700/20 shadow-md bg-amber-50/30"
                      : "border-amber-200 hover:border-amber-400"
                  }`}
                  onClick={() => setSelectedService(srv)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-stone-900 font-serif">
                        {srv.serviceName}
                      </h3>
                      {selectedService?.id === srv.id && (
                        <span className="h-2 w-2 rounded-full bg-red-700" />
                      )}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Traditional Vedic Vidhi with complete samagri guidance and
                      chanting
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold font-serif text-red-800 block">
                      {formatCurrency(srv.price)}
                    </span>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block mt-0.5">
                      Direct Cash
                    </span>
                    <Button
                      size="sm"
                      className={`mt-2 h-8 text-xs px-3 rounded-md font-bold cursor-pointer ${
                        selectedService?.id === srv.id
                          ? "bg-red-700 hover:bg-red-800 text-white shadow-xs"
                          : "border-2 border-amber-300 text-stone-800 hover:bg-amber-50"
                      }`}
                      variant={
                        selectedService?.id === srv.id ? "default" : "outline"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService(srv);
                        handleStartBooking(srv);
                      }}
                    >
                      {selectedService?.id === srv.id ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Availability Slots with Date Picker */}
        <div className="w-full md:w-[calc(42%-12px)] space-y-4">
          <h2 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-700" />
            <span>Auspicious Muhurat Slots</span>
          </h2>

          <div className="bg-white border-2 border-amber-300 rounded-xl p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Select Ceremony Date
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-sm">
                  Verified Calendar
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Calendar className="h-4 w-4 text-red-700 shrink-0" />
                <Input
                  type="date"
                  value={selectedDate}
                  min={todayStr}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs h-9 rounded-md border-amber-300 focus-visible:ring-red-700"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-stone-700">
                Slots for {formatFullDate(selectedDate)}:
              </div>

              {isSlotsLoading ? (
                <div className="text-center py-6 text-xs text-stone-500 font-medium">
                  Calculating auspicious Muhurat slots...
                </div>
              ) : activeBookableSlots.length === 0 ? (
                <div className="text-center py-6 text-xs text-stone-500 space-y-2">
                  <Clock className="h-8 w-8 mx-auto text-amber-600/40" />
                  <p>
                    No open slots on this date. Please pick another auspicious
                    date.
                  </p>
                </div>
              ) : (
                activeBookableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-3.5 rounded-md border-2 flex items-center justify-between cursor-pointer transition-all bg-white ${
                      selectedSlot?.id === slot.id
                        ? "border-red-700 ring-2 ring-red-700/20 shadow-xs bg-amber-50/40"
                        : "border-amber-200 hover:border-amber-400"
                    }`}
                    onClick={() => {
                      setSelectedSlot(slot);
                      handleStartBooking(undefined, slot);
                    }}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 font-mono">
                        <Clock className="h-3.5 w-3.5 text-red-700" />
                        <span>
                          {formatTime(slot.startTime)} –{" "}
                          {formatTime(slot.endTime)}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Standard Shubh Muhurat
                      </p>
                    </div>

                    <span className="text-[11px] font-bold text-red-700 hover:underline">
                      Book Slot →
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Review & Submission Modal */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => {
            // Prevent auto-scrolling down into inner form inputs on modal open
            e.preventDefault();
          }}
          className="sm:max-w-md w-[94vw] max-h-[85vh] flex flex-col p-4 sm:p-5 bg-white border-2 border-amber-300 rounded-lg shadow-2xl gap-3.5"
        >
          <DialogHeader className="shrink-0 space-y-1 text-left">
            <DialogTitle className="font-serif text-lg sm:text-xl font-bold text-stone-900">
              Confirm Ceremony Request
            </DialogTitle>
            <DialogDescription className="text-[11px] text-stone-600 leading-snug">
              Price is locked at request submission. Dakshina is payable
              directly in cash after ritual completion.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Body with Sleek Custom Scrollbar & Comfortable Padding */}
          <div className="flex-1 overflow-y-auto pr-3 space-y-4 text-xs custom-scrollbar">
            {/* Price & Service Summary Box */}
            <div className="p-3.5 rounded-md bg-amber-50 border border-amber-300 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Appointed Purohit:</span>
                <strong className="text-stone-900 font-serif text-xs sm:text-sm">
                  {priest.displayName || priest.fullName}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Ritual / Ceremony:</span>
                <strong className="text-stone-900 font-serif text-xs sm:text-sm">
                  {selectedService?.serviceName || "Selected Ceremony"}
                </strong>
              </div>
              <div className="flex items-center justify-between border-t border-amber-200 pt-1.5">
                <span className="text-stone-600">Service Dakshina:</span>
                <strong className="font-serif text-sm sm:text-base font-bold text-red-800">
                  {formatCurrency(selectedService?.price || 2100)} (Direct Cash)
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Scheduled Muhurat:</span>
                <span className="text-stone-900 font-bold text-[11px] sm:text-xs text-right">
                  {selectedSlot
                    ? `${formatFullDate(selectedSlot.date)} (${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)})`
                    : `${formatFullDate(selectedDate)} (Please pick a slot)`}
                </span>
              </div>
            </div>

            {/* Address Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-stone-900">
                  Puja Sanctum Venue (Home Address)
                </Label>
                <Link
                  to="/user/addresses"
                  className="text-xs text-red-700 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Address
                </Link>
              </div>

              {userAddresses.length === 0 ? (
                <div className="p-3 rounded-md border border-amber-300 bg-amber-50 text-stone-800 space-y-2">
                  <p className="text-xs">
                    You have no saved addresses. An address with PIN code is
                    required for the priest to arrive.
                  </p>
                  <Link to="/user/addresses">
                    <Button
                      size="sm"
                      className="text-xs h-7.5 bg-red-700 hover:bg-red-800 text-white rounded-md"
                    >
                      Add Address Now
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {userAddresses.map((addr) => {
                    const isServiceable =
                      !priest?.city ||
                      addr.city?.trim().toLowerCase() ===
                        priest.city?.trim().toLowerCase();
                    const isSelected = selectedAddressId === addr.id;

                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          if (isServiceable) setSelectedAddressId(addr.id);
                        }}
                        className={`p-2.5 rounded-md border-2 flex items-center justify-between transition-all ${
                          !isServiceable
                            ? "opacity-60 bg-stone-50 border-stone-200 cursor-not-allowed"
                            : isSelected
                              ? "border-red-700 ring-2 ring-red-700/20 shadow-2xs bg-white cursor-pointer"
                              : "border-amber-200 hover:border-amber-300 bg-white cursor-pointer"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-stone-900 text-xs font-serif">
                              {addr.houseNo || addr.houseBuilding},{" "}
                              {addr.villageTown || addr.locality}
                            </p>
                            {!isServiceable && (
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-xs">
                                Outside {priest?.city}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-600">
                            {addr.city}, {addr.state} -{" "}
                            <strong className="font-mono text-stone-900">
                              {addr.pincode}
                            </strong>
                          </p>
                        </div>
                        {isSelected && isServiceable && (
                          <Check className="h-4 w-4 text-red-700 shrink-0" />
                        )}
                      </div>
                    );
                  })}

                  {userAddresses.length > 0 &&
                    !userAddresses.some(
                      (a) =>
                        !priest?.city ||
                        a.city?.trim().toLowerCase() ===
                          priest.city?.trim().toLowerCase(),
                    ) && (
                      <div className="p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-950 text-xs space-y-1.5">
                        <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          No addresses in {priest?.city}
                        </p>
                        <p className="text-stone-700 text-[11px]">
                          This priest only conducts ceremonies in{" "}
                          <strong>{priest?.city}</strong>. Please add or select
                          an address located in {priest?.city}.
                        </p>
                        <Link
                          to="/user/addresses"
                          className="inline-block mt-1"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 border-amber-300 hover:bg-amber-100/50"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Address in{" "}
                            {priest?.city}
                          </Button>
                        </Link>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* User Notes with generous spacing & clean padding */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-bold text-stone-900 block">
                Special Notes or Requests (Optional)
              </Label>
              <Textarea
                placeholder="e.g. Please advise if Havan Kund or special samagri items are needed..."
                rows={3}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="text-xs rounded-md border-2 border-amber-300 hover:border-amber-400 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:outline-none transition-colors resize-none p-3 leading-relaxed w-full bg-white shadow-2xs"
              />
            </div>

            {/* 5-Hour Response SLA Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-red-50 border border-red-200 text-[11px] text-stone-700">
              <AlertCircle className="h-3.5 w-3.5 text-red-700 shrink-0 mt-0.5" />
              <span>
                <strong>5-Hour Purohit Confirmation SLA:</strong> Priest will
                confirm within <strong>5 hours</strong>. Payment is strictly in
                cash upon ritual completion.
              </span>
            </div>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="shrink-0 pt-3 border-t border-amber-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBookingOpen(false)}
              className="text-xs h-9 px-4 rounded-md border-2 border-amber-300 text-stone-800 hover:bg-amber-50 cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                isSubmitting ||
                !selectedSlot ||
                !selectedAddressId ||
                !selectedService ||
                !userAddresses.find(
                  (a) =>
                    a.id === selectedAddressId &&
                    (!priest?.city ||
                      a.city?.trim().toLowerCase() ===
                        priest.city?.trim().toLowerCase()),
                )
              }
              onClick={handleSubmitBooking}
              className="text-xs font-bold bg-[#780016] hover:bg-[#600012] text-white h-9 px-4 rounded-md shadow-xs border border-amber-400 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Sending Request..." : "Confirm Ceremony Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriestDetailsPage;
