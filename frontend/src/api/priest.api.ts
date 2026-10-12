import {
  Priest,
  PriestFilterParams,
  Ritual,
  PriestService,
} from '@/types/priest.types';
import { PincodeLookupResponse } from '@/types/address.types';
import { apiClient } from './client';
import { useAuthStore } from '@/store/auth.store';
import { logAppError, getUserFriendlyErrorMessage } from '@/lib/errorHandler';
import { getPriestExceptions, calculateDayMuhuratSlots, CalculatedSlot } from '@/lib/availabilityUtils';

export const priestApi = {
  // Helper to resolve current authenticated priest ID
  resolveCurrentPriestId: (): string => {
    const user = useAuthStore.getState().user;
    return user?.id || '';
  },

  // Public Approved Priests
  getPriests: async (params?: PriestFilterParams): Promise<Priest[]> => {
    try {
      const res = await apiClient.get('/priests', { params });
      return (res as any).data || res;
    } catch (error) {
      logAppError('priestApi.getPriests', error, { params });
      return [];
    }
  },

  getPriestById: async (id: string): Promise<Priest | undefined> => {
    try {
      const res = await apiClient.get(`/priests/${id}`);
      return (res as any).data || res;
    } catch (error) {
      logAppError('priestApi.getPriestById', error, { id });
      return undefined;
    }
  },

  getMyPriestProfile: async (): Promise<Priest | undefined> => {
    const priestId = priestApi.resolveCurrentPriestId();
    if (!priestId) return undefined;
    return priestApi.getPriestById(priestId);
  },

  updatePriestProfile: async (id: string, updates: Partial<Priest>) => {
    try {
      const res = await apiClient.put(`/priests/${id}`, updates);
      return res as any;
    } catch (error) {
      logAppError('priestApi.updatePriestProfile', error, { id });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to update priest profile. Please try again.'),
      };
    }
  },

  // Services & Pricing Catalog
  getPriestServices: async (priestId?: string): Promise<PriestService[]> => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      if (!activeId) return [];
      const res = await apiClient.get(`/priests/${activeId}/services`);
      return (res as any).data || res;
    } catch (error) {
      logAppError('priestApi.getPriestServices', error, { priestId });
      return [];
    }
  },

  getMyServices: async (): Promise<PriestService[]> => {
    return priestApi.getPriestServices();
  },

  createPriestService: async (priestId: string | undefined, data: { serviceName: string; price: number }) => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      const res = await apiClient.post(`/priests/${activeId}/services`, data);
      return res as any;
    } catch (error) {
      logAppError('priestApi.createPriestService', error, { priestId, data });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to create service. Please check the values and try again.'),
      };
    }
  },

  updatePriestService: async (
    serviceId: string,
    priestId: string | undefined,
    data: { serviceName?: string; price?: number; isActive?: boolean }
  ) => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      const res = await apiClient.put(`/priests/${activeId}/services/${serviceId}`, data);
      return res as any;
    } catch (error) {
      logAppError('priestApi.updatePriestService', error, { serviceId, priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to update service.'),
      };
    }
  },

  deletePriestService: async (serviceId: string, priestId?: string) => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      const res = await apiClient.delete(`/priests/${activeId}/services/${serviceId}`);
      return res as any;
    } catch (error) {
      logAppError('priestApi.deletePriestService', error, { serviceId, priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to remove service.'),
      };
    }
  },

  togglePriestService: async (serviceId: string, priestId?: string) => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      const res = await apiClient.patch(`/priests/${activeId}/services/${serviceId}/toggle`);
      return res as any;
    } catch (error) {
      logAppError('priestApi.togglePriestService', error, { serviceId, priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to toggle service status.'),
      };
    }
  },

  // Date-Based Muhurat Availability Computations
  getAvailableSlotsForDate: async (priestId: string, date: string): Promise<CalculatedSlot[]> => {
    try {
      const [exceptions, whData] = await Promise.all([
        getPriestExceptions(priestId),
        priestApi.getWorkingHours(priestId),
      ]);
      return calculateDayMuhuratSlots(
        priestId,
        date,
        exceptions,
        [],
        120,
        whData?.defaultStartTime || '07:00',
        whData?.defaultEndTime || '21:00'
      );
    } catch (error) {
      logAppError('priestApi.getAvailableSlotsForDate', error, { priestId, date });
      return [];
    }
  },

  // Availability Exceptions (Full-Day Leaves & Partial Blackouts)
  getPriestExceptions: async (priestId?: string, query?: { date?: string; startDate?: string; endDate?: string }): Promise<any[]> => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      if (!activeId) return [];
      const res = await apiClient.get(`/priests/${activeId}/exceptions`, { params: query });
      return (res as any).data || res || [];
    } catch (error) {
      logAppError('priestApi.getPriestExceptions', error, { priestId, query });
      return [];
    }
  },

  getMyExceptions: async (query?: { date?: string; startDate?: string; endDate?: string }): Promise<any[]> => {
    return priestApi.getPriestExceptions(undefined, query);
  },

  createPriestException: async (
    priestId: string | undefined,
    payload: { exceptionType?: string; startAt?: string; endAt?: string; date?: string; startTime?: string; endTime?: string; reason?: string }
  ) => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      const startAt = payload.startAt || (payload.date ? `${payload.date}T${payload.startTime || '07:00'}:00.000Z` : '');
      const endAt = payload.endAt || (payload.date ? `${payload.date}T${payload.endTime || '21:00'}:00.000Z` : '');
      const res = await apiClient.post(`/priests/${activeId}/exceptions`, {
        exceptionType: payload.exceptionType || 'BLOCK',
        startAt,
        endAt,
        reason: payload.reason || '',
      });
      return res as any;
    } catch (error) {
      logAppError('priestApi.createPriestException', error, { priestId, payload });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to save availability exception.'),
      };
    }
  },

  deletePriestException: async (exceptionId: string, priestId?: string) => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      const res = await apiClient.delete(`/priests/${activeId}/exceptions/${exceptionId}`);
      return res as any;
    } catch (error) {
      logAppError('priestApi.deletePriestException', error, { exceptionId, priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to delete availability exception.'),
      };
    }
  },

  // Default Working Hours
  getWorkingHours: async (priestId?: string) => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      if (!activeId) return null;
      const res = await apiClient.get(`/priests/${activeId}/working-hours`);
      return (res as any).data || res;
    } catch (error) {
      logAppError('priestApi.getWorkingHours', error, { priestId });
      return null;
    }
  },

  updateWorkingHours: async (
    priestId: string | undefined,
    data: { defaultStartTime?: string; defaultEndTime?: string }
  ) => {
    try {
      const activeId = priestId || priestApi.resolveCurrentPriestId();
      const res = await apiClient.put(`/priests/${activeId}/working-hours`, data);
      return res as any;
    } catch (error) {
      logAppError('priestApi.updateWorkingHours', error, { priestId, data });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to update working hours.'),
      };
    }
  },

  getRituals: async (): Promise<Ritual[]> => {
    try {
      const res = await apiClient.get('/rituals');
      return (res as any).data || res;
    } catch (error) {
      logAppError('priestApi.getRituals', error);
      return [];
    }
  },

  // Admin Management APIs
  getAllPriests: async (params?: PriestFilterParams): Promise<Priest[]> => {
    try {
      const res = await apiClient.get('/admin/priests', { params });
      return (res as any).data || res;
    } catch (error) {
      logAppError('priestApi.getAllPriests', error, { params });
      return [];
    }
  },

  getPendingPriests: async (): Promise<Priest[]> => {
    try {
      const res = await apiClient.get('/admin/priests/pending');
      return (res as any).data || res;
    } catch (error) {
      logAppError('priestApi.getPendingPriests', error);
      return [];
    }
  },

  approvePriest: async (priestId: string) => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/approve`);
      return res as any;
    } catch (error) {
      logAppError('priestApi.approvePriest', error, { priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to approve priest.'),
      };
    }
  },

  rejectPriest: async (priestId: string, reason: string = 'Application incomplete') => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/reject`, { reason });
      return res as any;
    } catch (error) {
      logAppError('priestApi.rejectPriest', error, { priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to reject priest.'),
      };
    }
  },

  banPriest: async (priestId: string, reason: string = 'Policy violation') => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/ban`, { reason });
      return res as any;
    } catch (error) {
      logAppError('priestApi.banPriest', error, { priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to ban priest.'),
      };
    }
  },

  reactivatePriest: async (priestId: string) => {
    try {
      const res = await apiClient.post(`/admin/priests/${priestId}/unban`);
      return res as any;
    } catch (error) {
      logAppError('priestApi.reactivatePriest', error, { priestId });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to reactivate priest.'),
      };
    }
  },

  lookupPincode: async (pincode: string): Promise<PincodeLookupResponse> => {
    try {
      const res = await apiClient.get(`/geo/pincode/${pincode}`);
      return (res as any).data || res;
    } catch (error) {
      logAppError('priestApi.lookupPincode', error, { pincode });
      return { pincode, locations: [] };
    }
  },
};
