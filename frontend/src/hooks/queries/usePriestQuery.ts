import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priestApi } from '@/api/priest.api';
import { PriestFilterParams, Priest } from '@/types/priest.types';

export const priestKeys = {
  all: ['priests'] as const,
  lists: () => [...priestKeys.all, 'list'] as const,
  list: (params?: PriestFilterParams) => [...priestKeys.lists(), params] as const,
  detail: (id: string) => [...priestKeys.all, 'detail', id] as const,
  myProfile: () => [...priestKeys.all, 'my-profile'] as const,
  services: (priestId?: string) => [...priestKeys.all, 'services', priestId] as const,
};

export function usePriests(params?: PriestFilterParams) {
  return useQuery({
    queryKey: priestKeys.list(params),
    queryFn: () => priestApi.getPriests(params),
  });
}

export function usePriestDetails(id: string) {
  return useQuery({
    queryKey: priestKeys.detail(id),
    queryFn: () => priestApi.getPriestById(id),
    enabled: !!id,
  });
}

export function useMyPriestProfile() {
  return useQuery({
    queryKey: priestKeys.myProfile(),
    queryFn: () => priestApi.getMyPriestProfile(),
  });
}

export function usePriestServices(priestId?: string) {
  return useQuery({
    queryKey: priestKeys.services(priestId),
    queryFn: () => priestApi.getPriestServices(priestId),
  });
}



export function useUpdatePriestProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Priest> }) =>
      priestApi.updatePriestProfile(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: priestKeys.all });
      queryClient.invalidateQueries({ queryKey: priestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: priestKeys.myProfile() });
    },
  });
}
