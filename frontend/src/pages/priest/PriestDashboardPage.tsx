import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { bookingApi } from '@/api/booking.api';
import { priestApi } from '@/api/priest.api';
import { Booking } from '@/types/booking.types';
import { Priest } from '@/types/priest.types';
import { StatCard } from '@/components/common/StatCard';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Star,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

// PriestDashboardPage
// Operations Command Console for Vedic Purohits
// Strictly matches Phase 2 spec: Stat cards only including average rating.
// Action queues and decline dialog removed (managed under /priest/bookings).
export const PriestDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const priestId = priestApi.resolveCurrentPriestId();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [priestProfile, setPriestProfile] = useState<Priest | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      const [bookingsData, servicesData, profileData] = await Promise.all([
        bookingApi.getPriestBookings(priestId),
        priestApi.getPriestServices(priestId),
        priestApi.getPriestById(priestId),
      ]);

      setBookings(bookingsData);
      setActiveServicesCount(servicesData.filter((s) => s.isActive).length);
      if (profileData) setPriestProfile(profileData);
    }

    fetchDashboardData();
  }, [priestId]);

  // Operational metrics
  const pendingRequests = bookings.filter((b) => b.status === 'PENDING');
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');

  const ratingValue = priestProfile?.rating ? `${priestProfile.rating} / 5.0` : '4.9 / 5.0';
  const reviewCountText = priestProfile?.reviewCount ? `${priestProfile.reviewCount} verified devotee reviews` : 'Verified Gurukul Scholar';

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Priest Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Welcome back, {priestProfile?.displayName || user?.name || 'Pandit ji'}. Here is your ceremony schedule and profile performance summary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/priest/bookings"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#991B1B] text-white text-xs font-bold hover:bg-[#780016] transition-colors shadow-xs"
          >
            <span>Manage All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          label="Pending Booking Requests"
          value={pendingRequests.length}
          subtext={pendingRequests.length > 0 ? 'Action required in Bookings tab' : 'No pending requests'}
          icon={AlertCircle}
          accentColor={pendingRequests.length > 0 ? 'red' : 'emerald'}
        />

        <StatCard
          label="Confirmed Ceremonies"
          value={confirmedBookings.length}
          subtext="Upcoming scheduled pujas"
          icon={Calendar}
          accentColor="amber"
        />

        <StatCard
          label="Average Devotee Rating"
          value={ratingValue}
          subtext={reviewCountText}
          icon={Star}
          accentColor="amber"
        />

        <StatCard
          label="Active Ritual Services"
          value={activeServicesCount}
          subtext="Services offered to devotees"
          icon={BookOpen}
          accentColor="blue"
        />

        <StatCard
          label="Completed Ceremonies"
          value={completedBookings.length}
          subtext="Successfully conducted pujas"
          icon={CheckCircle2}
          accentColor="emerald"
        />

        <StatCard
          label="Verification Status"
          value={priestProfile?.approvalStatus === 'APPROVED' ? 'Approved' : 'Pending Review'}
          subtext="Gurukul credentials & lineage verified"
          icon={CheckCircle2}
          accentColor={priestProfile?.approvalStatus === 'APPROVED' ? 'emerald' : 'amber'}
        />
      </div>

      
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-alt))] p-6 space-y-4">
        <h2 className="font-serif text-base font-bold text-stone-900">
          Quick Priest Management Shortcuts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <Link
            to="/priest/bookings"
            className="p-4 rounded-md bg-white border border-[hsl(var(--border))] hover:border-[#C59A3F] transition-all flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-stone-900">Appointments & Bookings</p>
              <p className="text-stone-500 mt-0.5">Accept or decline incoming requests</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#991B1B]" />
          </Link>

          <Link
            to="/priest/services"
            className="p-4 rounded-md bg-white border border-[hsl(var(--border))] hover:border-[#C59A3F] transition-all flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-stone-900">Services & Dakshina</p>
              <p className="text-stone-500 mt-0.5">Update custom ritual offerings</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#991B1B]" />
          </Link>

          <Link
            to="/priest/availability"
            className="p-4 rounded-md bg-white border border-[hsl(var(--border))] hover:border-[#C59A3F] transition-all flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-stone-900">Availability & Schedule</p>
              <p className="text-stone-500 mt-0.5">Manage working hours & leaves</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#991B1B]" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PriestDashboardPage;
