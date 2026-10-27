import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { bookingApi } from '@/api/booking.api';
import { Booking } from '@/types/booking.types';
import { RatingInput } from '@/schemas/booking.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import { RatingModal } from '@/components/booking/RatingModal';
import { formatINR, formatDate } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Phone,
  ArrowRight,
  Star,
  Ban,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type FilterTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export const BookingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dialog States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<Booking | null>(null);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await bookingApi.getBookings(user?.id);
      setBookings(data);
    } catch {
      toast.error('Failed to load your ceremony bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user?.id]);

  const handleConfirmCancel = async (reason: string) => {
    if (!bookingToCancel || !user) return;
    const res = await bookingApi.cancelBooking({ bookingId: bookingToCancel.id, userId: user.id, reason });
    if (res.success) {
      toast.success('Puja appointment cancelled.');
      setCancelModalOpen(false);
      loadBookings();
    } else {
      toast.error(res.message || 'Failed to cancel.');
    }
  };

  const handleRatingSubmit = async (data: RatingInput) => {
    if (!bookingToRate) return;
    const activeUserId = user?.id || bookingToRate.userId;
    const res = await bookingApi.submitRating(activeUserId, {
      bookingId: bookingToRate.id,
      rating: data.rating || 5,
      review: data.review,
    });
    if (res.success) {
      toast.success('Thank you for your rating and review!');
      setRatingModalOpen(false);
      loadBookings();
    } else {
      toast.error(res.message || 'Failed to submit review.');
    }
  };

  // Filter bookings based on active status tab and search query
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'PENDING' && b.status !== 'PENDING') return false;
    if (activeTab === 'CONFIRMED' && b.status !== 'CONFIRMED') return false;
    if (activeTab === 'COMPLETED' && b.status !== 'COMPLETED') return false;
    if (activeTab === 'CANCELLED' && !['CANCELLED', 'REJECTED', 'EXPIRED'].includes(b.status)) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const refMatch = (b.bookingReference || b.id).toLowerCase().includes(query);
      const ritualMatch = (b.serviceName || '').toLowerCase().includes(query);
      const priestMatch = (b.priest?.displayName || b.priest?.fullName || '').toLowerCase().includes(query);
      return refMatch || ritualMatch || priestMatch;
    }
    return true;
  });

  // Calculate counts for tab badges
  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b) => ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(b.status)).length,
  };

  return (
    <div className="container py-6 sm:py-8 space-y-6 max-w-5xl">
      {/* 1. Page Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-amber-100 border border-amber-300 text-stone-900 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>Devotee Appointments • Shubh Muhurats</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            My Sacred Ceremonies & Bookings
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Review upcoming auspicious appointments, coordinate with your appointed Purohit, and access completed puja blessings.
          </p>
        </div>

        <Link to="/user/priests" className="shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 text-xs sm:text-sm font-bold bg-red-700 hover:bg-red-800 text-white rounded-md shadow-md h-11 px-5 active:scale-[0.98] transition-transform cursor-pointer">
            <span>Schedule New Puja</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 2. Stat Counters Strip (Flexbox Only) */}
      <div className="flex flex-wrap gap-3 w-full">
        <div className="flex-1 min-w-36 bg-white border-2 border-amber-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Total Ceremonies
          </span>
          <span className="text-2xl font-bold font-serif text-stone-900 mt-1 block">
            {counts.all}
          </span>
        </div>

        <div className="flex-1 min-w-36 bg-white border-2 border-emerald-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Confirmed & Scheduled
          </span>
          <span className="text-2xl font-bold font-serif text-emerald-700 mt-1 block">
            {counts.confirmed}
          </span>
        </div>

        <div className="flex-1 min-w-36 bg-white border-2 border-amber-300 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Awaiting Purohit
          </span>
          <span className="text-2xl font-bold font-serif text-amber-600 mt-1 block">
            {counts.pending}
          </span>
        </div>

        <div className="flex-1 min-w-36 bg-white border-2 border-stone-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
            Completed Blessings
          </span>
          <span className="text-2xl font-bold font-serif text-stone-800 mt-1 block">
            {counts.completed}
          </span>
        </div>
      </div>

      {/* 3. Tabs & Live Search Filter Hub */}
      <div className="bg-white border-2 border-amber-300 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
        <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as FilterTab)}>
            <TabsList className="inline-flex h-11 items-center justify-start rounded-md bg-stone-100 p-1 text-stone-600 border border-stone-200 min-w-max gap-1">
              <TabsTrigger
                value="ALL"
                className="text-xs px-3.5 py-1.5 h-9 gap-1.5 rounded-sm data-[state=active]:bg-red-700 data-[state=active]:text-white data-[state=active]:shadow-sm font-bold active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>All</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-stone-200 text-[10px] font-bold text-stone-900">
                  {counts.all}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="PENDING"
                className="text-xs px-3.5 py-1.5 h-9 gap-1.5 rounded-sm data-[state=active]:bg-red-700 data-[state=active]:text-white data-[state=active]:shadow-sm font-bold active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Pending Acceptance</span>
                {counts.pending > 0 && (
                  <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-amber-400 text-stone-950">
                    {counts.pending}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="CONFIRMED"
                className="text-xs px-3.5 py-1.5 h-9 gap-1.5 rounded-sm data-[state=active]:bg-red-700 data-[state=active]:text-white data-[state=active]:shadow-sm font-bold active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Confirmed</span>
                {counts.confirmed > 0 && (
                  <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-600 text-white">
                    {counts.confirmed}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="COMPLETED"
                className="text-xs px-3.5 py-1.5 h-9 gap-1.5 rounded-sm data-[state=active]:bg-red-700 data-[state=active]:text-white data-[state=active]:shadow-sm font-bold active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Completed</span>
                {counts.completed > 0 && (
                  <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-stone-700 text-white">
                    {counts.completed}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="CANCELLED"
                className="text-xs px-3.5 py-1.5 h-9 gap-1.5 rounded-sm data-[state=active]:bg-red-700 data-[state=active]:text-white data-[state=active]:shadow-sm font-bold active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Cancelled</span>
                {counts.cancelled > 0 && (
                  <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-red-600 text-white">
                    {counts.cancelled}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <Input
            placeholder="Search bookings by ceremony, purohit name, or reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 text-xs sm:text-sm h-10 rounded-md border-amber-300 focus-visible:ring-red-700"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Bookings List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-stone-500 font-medium">
          Retrieving ceremony records...
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="flex flex-col gap-4 w-full">
          {filteredBookings.map((b) => {
            const canCancel = b.status === 'PENDING' || b.status === 'CONFIRMED';
            const canRate = b.status === 'COMPLETED' && !b.ratingSubmitted;

            return (
              <div
                key={b.id}
                className="w-full bg-white border-2 border-amber-200 hover:border-amber-400 rounded-xl p-5 sm:p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  {/* Title & Status Bar */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-lg font-serif text-stone-900 group-hover:text-red-700 transition-colors">
                      {b.serviceName || 'Vedic Ceremony'}
                    </span>
                    <BookingStatusBadge status={b.status} />
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-sm bg-amber-100 border border-amber-300 text-stone-900">
                      {b.bookingReference || b.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Auspicious Timings & Venue Details */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-700">
                    <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                      <Calendar className="w-4 h-4 text-red-700 shrink-0" />
                      <span>{formatDate(b.bookingDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : 'Morning Muhurat'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-700 shrink-0" />
                      <span className="truncate max-w-xs">
                        {b.address ? `${b.address.villageTown || b.address.city}, ${b.address.city}` : 'Home Address'}
                      </span>
                    </div>
                  </div>

                  {/* Priest and Dakshina Row */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 pt-2 border-t border-amber-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-500 font-medium">Appointed Priest:</span>
                      <strong className="text-stone-900 font-semibold">
                        {b.priest?.displayName || b.priest?.fullName || 'Assigned Purohit'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-500 font-medium">Dakshina:</span>
                      <strong className="text-red-800 font-serif text-sm">
                        {formatINR(b.servicePrice || b.dakshinaAmount || 2100)}
                      </strong>
                      <span className="text-[11px] text-stone-500">(Direct cash after puja)</span>
                    </div>

                    {b.status === 'CONFIRMED' && b.priest?.phoneNumber && (
                      <a
                        href={`tel:${b.priest.phoneNumber}`}
                        className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-900 font-bold ml-auto"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Call {b.priest.phoneNumber}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions Block */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                  <Link to={`/user/bookings/${b.id}`} className="w-full sm:w-auto">
                    <Button className="gap-1.5 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-md shadow-xs w-full sm:w-auto h-10 px-5 cursor-pointer">
                      <span>View Details & Samagri</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  {canRate && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setBookingToRate(b);
                        setRatingModalOpen(true);
                      }}
                      className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold w-full sm:w-auto h-10 px-4 rounded-md cursor-pointer shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5 fill-stone-950" />
                      <span>Rate Purohit</span>
                    </Button>
                  )}

                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBookingToCancel(b);
                        setCancelModalOpen(true);
                      }}
                      className="gap-1 text-xs text-red-700 hover:text-red-800 hover:bg-red-50 border-2 border-red-200 w-full sm:w-auto h-10 px-4 rounded-md cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-amber-300 rounded-xl p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-amber-100 text-red-700 border-2 border-amber-300">
              <Calendar className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-serif text-stone-900">
                {searchQuery ? 'No Matching Appointments' : 'No Sacred Bookings Found'}
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                {searchQuery
                  ? 'No ceremony bookings matched your search query. Try clearing the search.'
                  : 'You have no ceremony bookings in this category. Schedule an auspicious home puja with verified Purohits.'}
              </p>
            </div>
            <Link to="/user/priests">
              <Button className="gap-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-md shadow-md h-10 px-5 cursor-pointer">
                <Search className="h-3.5 w-3.5" /> Discover Purohits
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Modals */}
      <CancelBookingDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        bookingReference={bookingToCancel?.bookingReference || bookingToCancel?.id}
      />

      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        bookingId={bookingToRate?.id || ''}
        priestName={bookingToRate?.priest?.displayName || bookingToRate?.priest?.fullName}
        serviceName={bookingToRate?.serviceName}
        initialRating={bookingToRate?.rating || 5}
        initialReview={bookingToRate?.review || ''}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};

export default BookingsPage;

