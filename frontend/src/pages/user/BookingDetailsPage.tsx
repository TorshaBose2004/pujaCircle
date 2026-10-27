import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { bookingApi } from '@/api/booking.api';
import { Booking } from '@/types/booking.types';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { BookingTimelineCard } from '@/components/booking/BookingTimelineCard';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import { RatingModal } from '@/components/booking/RatingModal';
import { Button } from '@/components/ui/button';
import { formatINR, formatDate } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Phone,
  Star,
  Ban,
  Check,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Copy,
  KeyRound,
} from 'lucide-react';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { toast } from 'sonner';

/**
 * BookingDetailsPage
 * Auspicious ceremony appointment details and live timeline for devotees.
 * 100% Flexbox, pure solid white canvas, radiant Haldi gold trims, deep vermilion accents.
 */
export const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [manualRating, setManualRating] = useState<number>(5);
  const [manualReview, setManualReview] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchBooking = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await bookingApi.getBookingById(id);
      if (data) {
        setBooking(data);
        if (data.rating) setManualRating(data.rating);
        if (data.review) setManualReview(data.review);
      } else {
        toast.error('Booking not found.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleCancelConfirm = async (reason: string) => {
    if (!booking || !user) return;
    const res = await bookingApi.cancelBooking({ bookingId: booking.id, userId: user.id, reason });
    if (res.success) {
      toast.success('Puja appointment cancelled successfully.');
      fetchBooking();
    } else {
      toast.error(res.message || 'Failed to cancel booking.');
    }
  };

  const handleRatingSubmit = async (ratingData: any) => {
    if (!booking) return;
    const activeUserId = user?.id || booking.userId;
    const res = await bookingApi.submitRating(activeUserId, {
      bookingId: booking.id,
      rating: ratingData.rating || 5,
      review: ratingData.review,
    });
    if (res.success) {
      toast.success('Thank you for rating and reviewing the ceremony!');
      setIsRatingModalOpen(false);
      fetchBooking();
    } else {
      toast.error(res.message || 'Failed to submit review.');
    }
  };

  const handleManualReviewSubmit = async () => {
    if (!booking) return;
    const activeUserId = user?.id || booking.userId;
    const finalRating = manualRating || booking.rating || 5;
    setIsSubmittingReview(true);
    try {
      const res = await bookingApi.submitRating(activeUserId, {
        bookingId: booking.id,
        rating: finalRating,
        review: manualReview.trim(),
      });
      if (res.success) {
        toast.success('Thank you for your rating and review!');
        await fetchBooking();
      } else {
        toast.error(res.message || 'Failed to submit review.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCopyAddress = (addrText: string) => {
    navigator.clipboard.writeText(addrText);
    toast.success('Venue address copied to clipboard.');
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 mx-auto rounded-md bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-black text-xl shadow-sm animate-pulse">
            ॐ
          </div>
          <p className="text-xs text-stone-600 font-medium">Loading sacred ceremony details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-xl border-2 border-amber-300 bg-white shadow-md">
          <div className="h-12 w-12 mx-auto rounded-md bg-[#780016] text-white flex items-center justify-center font-serif font-bold text-2xl">
            ॐ
          </div>
          <h2 className="text-lg font-bold font-serif text-stone-900">Ceremony Record Not Found</h2>
          <p className="text-xs text-stone-600">The requested ceremony appointment could not be located in your account.</p>
          <Link to="/user/bookings">
            <Button size="sm" className="gap-1.5 text-xs bg-[#780016] hover:bg-red-800 text-white font-bold rounded-md h-10 px-5 border border-amber-400">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to My Bookings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isDevoteeOwner = !booking.userId || !user?.id || user.id.toLowerCase() === booking.userId.toLowerCase() || user.role === 'USER';
  const canCancel = (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && isDevoteeOwner;
  const canRate = booking.status === 'COMPLETED' && isDevoteeOwner;

  const addressString = booking.address
    ? `${booking.address.houseNo ? `${booking.address.houseNo}, ` : ''}${booking.address.villageTown ? `${booking.address.villageTown}, ` : ''}${booking.address.city}, ${booking.address.state} - ${booking.address.pincode}`
    : 'Primary Devotee Residence';

  const defaultSamagriItems = [
    'Ganga Jal & Panchamrit (Milk, Curd, Honey, Sugar, Ghee)',
    'Roli, Chandan, Haldi & Akshat (Unbroken Sacred Rice)',
    'Betel Leaves (Paan), Supari, Clove & Cardamom',
    'Fresh Yellow & Red Flowers, Tulsi Patra, Bel Patra',
    'Coconut with Husk (Shriphal) & Red Kalava / Mauli Thread',
    'Dhoop Cones, Camphor (Kapur) & Pure Cow Ghee Diya',
    'Seasonal Fruits (5 varieties) & Sweets / Modak / Kheer Prasad',
    'Havan Kund, Dry Mango Wood & Sacred Havan Samagri Herbs',
  ];

  return (
    <div className="w-full text-stone-900 py-6 sm:py-10 px-4">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Top Breadcrumb & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/user/bookings"
            className="text-xs text-stone-600 hover:text-red-700 flex items-center gap-1.5 font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Bookings
          </Link>

          <div className="flex items-center gap-2">
            {canRate && (
              <Button
                size="sm"
                onClick={() => setIsRatingModalOpen(true)}
                className="gap-1.5 text-xs bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-md active:scale-[0.98] transition-transform shadow-xs h-9 px-4 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-stone-950" /> Rate Ceremony
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="gap-1.5 text-xs text-red-700 hover:text-red-800 border-red-200 hover:bg-red-50 rounded-md active:scale-[0.98] transition-transform h-9 px-4 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" /> Cancel Appointment
              </Button>
            )}
          </div>
        </div>

        {/* Main Booking Master Card (Solid Pure White, Double Hairline Gold Border) */}
        <div className="w-full bg-white border-2 border-amber-300 rounded-xl shadow-md overflow-hidden">
          {/* Header Banner (Solid Vermilion #780016 with Gold Trim) */}
          <div className="p-6 sm:p-7 bg-[#780016] text-white border-b-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-md bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-black text-2xl shadow-md shrink-0 select-none">
                ॐ
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-white text-stone-900 rounded-md border border-amber-300">
                    {booking.bookingReference || booking.id}
                  </span>
                  <span className="text-xs text-amber-100 font-medium">
                    Requested on {formatDate(booking.createdAt)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-tight">
                  {booking.serviceName || 'Sacred Puja Ceremony'}
                </h1>
              </div>
            </div>
            <div className="self-start sm:self-center">
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 bg-white">
            {/* Progress Stepper (Flexbox Only, Pure White) */}
            <BookingTimelineCard status={booking.status} />

            {/* Live 5-Hour SLA Countdown for Pending Requests */}
            {booking.status === 'PENDING' && booking.responseDeadline && (
              <CountdownTimer
                targetDate={booking.responseDeadline}
                label="Purohit Acceptance Window"
              />
            )}

            {/* Cash Dakshina Handshake & Ceremony Completion Verification Code */}
            {booking.status === 'CONFIRMED' && (
              <div className="p-4 sm:p-5 rounded-lg border-2 border-emerald-300 bg-emerald-50/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                        Ceremony Completion Verification Code
                      </h3>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Share this 4-digit code with Pandit Ji <strong>only after</strong> the puja ceremony is completed and Dakshina is handed over.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-md border-2 border-emerald-400 shadow-2xs shrink-0 self-start sm:self-center">
                    <span className="font-mono text-2xl font-black tracking-widest text-emerald-900 select-all">
                      {booking.completionCode || '— — — —'}
                    </span>
                    {booking.completionCode && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(booking.completionCode!);
                          toast.success('Completion code copied!');
                        }}
                        className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer transition-colors"
                        title="Copy Code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Details Deck: 100% Flexbox, Zero CSS Grids */}
            <div className="flex flex-col md:flex-row items-stretch gap-6 pt-2 w-full">
              {/* Schedule & Venue Card */}
              <div className="flex-1 space-y-3 p-5 rounded-lg border-2 border-amber-200 bg-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-700" />
                  <span>Auspicious Muhurat & Venue</span>
                </h3>

                <div className="space-y-3 text-xs pt-1">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-amber-50/50 border border-amber-200">
                    <Calendar className="w-4 h-4 text-red-700 shrink-0" />
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-semibold block">Date</span>
                      <strong className="text-stone-900 text-xs">{formatDate(booking.bookingDate)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-amber-50/50 border border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-semibold block">Time Window</span>
                      <strong className="text-stone-900 text-xs">
                        {booking.slot ? `${booking.slot.startTime} - ${booking.slot.endTime}` : 'Morning Shubh Muhurat (08:00 AM - 11:30 AM)'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-md bg-amber-50/50 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-stone-800 font-bold text-xs">
                        <MapPin className="w-3.5 h-3.5 text-red-700" />
                        <span>Sacred Venue</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAddress(addressString)}
                        className="text-[11px] text-amber-800 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <p className="text-stone-700 text-xs leading-relaxed font-medium">
                      {addressString}
                    </p>
                  </div>
                </div>
              </div>

              {/* Priest & Dakshina Card */}
              <div className="flex-1 space-y-3 p-5 rounded-lg border-2 border-amber-200 bg-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-700" />
                  <span>Appointed Purohit & Dakshina</span>
                </h3>

                <div className="space-y-3 text-xs pt-1">
                  {/* Priest Bio Header */}
                  <div className="p-3 rounded-md bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-bold text-base border-2 border-amber-500 shrink-0">
                        {booking.priest?.displayName ? booking.priest.displayName.charAt(0) : 'प'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900 text-xs sm:text-sm">
                            {booking.priest?.displayName || booking.priest?.fullName || 'Acharya Pt. Ramesh Sharma'}
                          </span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] text-stone-600 block">
                          Verified Gurukul Lineage
                        </span>
                      </div>
                    </div>

                    {booking.status === 'CONFIRMED' && (
                      <a
                        href={`tel:${booking.priest?.phoneNumber || '+919876543211'}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    )}
                  </div>

                  {/* Cash Dakshina Amount */}
                  <div className="p-3.5 rounded-md bg-white border-2 border-amber-300 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">
                        Cash Dakshina (On Completion)
                      </span>
                      <span className="text-[11px] text-stone-600">Zero platform markup</span>
                    </div>
                    <span className="text-2xl font-bold font-serif text-red-800">
                      {formatINR(booking.servicePrice || booking.dakshinaAmount || 2100)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-stone-700 pt-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Zero online advance deposit. Transparent pricing.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Hand over dakshina directly in cash or UPI after puja.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sacred Samagri Checklist Section */}
            <div className="w-full p-5 rounded-lg border-2 border-amber-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Sacred Samagri Preparation Checklist</span>
                </h3>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  Devotee Reference
                </span>
              </div>

              <p className="text-xs text-stone-600">
                Please keep the following sacred articles prepared before Pandit Ji arrives at your home:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {((booking.samagriList && booking.samagriList.length > 0) ? booking.samagriList : defaultSamagriItems).map((item, idx) => (
                  <div
                    key={idx}
                    className="w-full sm:w-[calc(50%-4px)] flex items-start gap-2 p-2.5 rounded-md border border-stone-200 bg-white text-xs text-stone-800 font-medium"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Ceremony Review & Rating Section */}
            {booking.status === 'COMPLETED' && isDevoteeOwner && (
              <div className="w-full p-5 sm:p-6 rounded-lg border-2 border-amber-300 bg-amber-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>Ceremony Rating & Sacred Review</span>
                  </h3>
                  {booking.rating && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                      ✓ Review Recorded
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-4 bg-white rounded-md border border-amber-200">
                  {booking.rating && (
                    <div className="p-3 bg-amber-50/60 rounded border border-amber-200 space-y-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= (booking.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                          />
                        ))}
                        <span className="text-xs font-bold text-stone-800 ml-1.5">
                          Current Rating: {booking.rating} / 5 Stars
                        </span>
                      </div>
                      {booking.review && (
                        <p className="text-xs text-stone-700 italic border-l-2 border-amber-400 pl-2.5 py-0.5">
                          "{booking.review}"
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1.5">
                      {booking.rating ? 'Update Your Star Rating:' : 'Select Star Rating:'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setManualRating(star)}
                          className="p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= manualRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'} transition-colors`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-stone-700 ml-2">
                        {manualRating === 5 && 'Outstanding & Divine (5/5)'}
                        {manualRating === 4 && 'Very Good (4/5)'}
                        {manualRating === 3 && 'Satisfactory (3/5)'}
                        {manualRating === 2 && 'Needs Improvement (2/5)'}
                        {manualRating === 1 && 'Disappointing (1/5)'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="devotee-manual-review-box" className="text-xs font-bold text-stone-800 block mb-1.5">
                      Write Review & Sacred Experience (Manual Box):
                    </label>
                    <textarea
                      id="devotee-manual-review-box"
                      rows={3}
                      value={manualReview}
                      onChange={(e) => setManualReview(e.target.value)}
                      placeholder="Share details about punctuality, Vedic pronunciation, samagri guidance, etc."
                      className="w-full text-xs p-3 rounded-md border border-amber-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500 resize-none bg-white text-stone-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={isSubmittingReview || (!manualRating && !manualReview.trim())}
                      onClick={handleManualReviewSubmit}
                      className="text-xs font-bold bg-[#780016] hover:bg-red-800 text-white rounded-md h-9 px-5 shadow-xs cursor-pointer border border-amber-400 disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Submitting Review...' : booking.rating || booking.review ? 'Update Review & Rating' : 'Submit Review'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation / Decline Notes */}
            {booking.rejectionReason && (
              <div className="p-4 rounded-md bg-red-50 border-2 border-red-200 text-red-800 text-xs space-y-1">
                <strong className="font-bold">Priest Decline Reason:</strong>
                <p>{booking.rejectionReason}</p>
              </div>
            )}
            {booking.cancellationReason && (
              <div className="p-4 rounded-md bg-stone-100 border-2 border-stone-300 text-stone-700 text-xs space-y-1">
                <strong className="font-bold">Cancellation Reason:</strong>
                <p>{booking.cancellationReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CancelBookingDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        bookingReference={booking.bookingReference || booking.id}
      />

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        bookingId={booking.id}
        priestName={booking.priest?.displayName || booking.priest?.fullName}
        serviceName={booking.serviceName}
        initialRating={booking.rating || manualRating || 5}
        initialReview={booking.review || manualReview || ''}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};

export default BookingDetailsPage;
