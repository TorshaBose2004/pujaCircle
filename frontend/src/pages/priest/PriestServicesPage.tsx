import React, { useState, useEffect } from 'react';
import { priestApi } from '@/api/priest.api';
import { PriestService } from '@/types/priest.types';
import { PriestServiceInput } from '@/schemas/priest.schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceFormModal } from '@/components/priest/ServiceFormModal';
import { Plus, Edit2, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * PriestServicesPage
 * Priest ceremony offerings catalogue and cash dakshina rates editor.
 * 100% Flexbox, zero CSS grids, zero gradients, pure solid white canvas, Haldi gold trims.
 */
export const PriestServicesPage: React.FC = () => {
  const priestId = priestApi.resolveCurrentPriestId();

  const [services, setServices] = useState<PriestService[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<PriestService | null>(null);

  const fetchServices = async () => {
    try {
      const data = await priestApi.getPriestServices(priestId);
      setServices(data);
    } catch {
      toast.error('Failed to load services.');
    }
  };

  useEffect(() => {
    fetchServices();
  }, [priestId]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: PriestService) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleSaveService = async (data: PriestServiceInput) => {
    try {
      if (editingService) {
        const res = await priestApi.updatePriestService(editingService.id, priestId, data);
        if (res.success) {
          toast.success('Ceremony rate updated.');
          fetchServices();
          setIsModalOpen(false);
        } else {
          toast.error(res.message || 'Failed to update service.');
        }
      } else {
        const res = await priestApi.createPriestService(priestId, {
          serviceName: data.serviceName,
          price: data.price,
          pujaCatalogId: data.pujaCatalogId,
        });
        if (res.success) {
          toast.success('Ceremony offering added.');
          fetchServices();
          setIsModalOpen(false);
        } else {
          toast.error(res.message || 'Failed to add service.');
        }
      }
    } catch {
      toast.error('Failed to save service.');
    }
  };

  const handleToggle = async (serviceId: string) => {
    try {
      const res = await priestApi.togglePriestService(serviceId, priestId);
      if (res.success) {
        toast.success(res.message);
        fetchServices();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Failed to update service status.');
    }
  };

  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${serviceName}"?`)) {
      return;
    }
    try {
      const res = await priestApi.deletePriestService(serviceId, priestId);
      if (res.success) {
        toast.success(`"${serviceName}" removed.`);
        fetchServices();
      } else {
        toast.error(res.message || 'Failed to remove service.');
      }
    } catch {
      toast.error('Failed to remove service.');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl text-stone-900 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-xl border-2 border-amber-300 bg-white shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-md bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-black text-2xl shadow-md shrink-0 select-none">
            ॐ
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-950">
              Ceremony Offerings & Dakshina Rates
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Configure the specific Vedic rituals you offer and your recommended cash dakshina amounts.
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="gap-2 text-xs h-11 px-5 bg-[#780016] hover:bg-red-800 text-white font-bold border border-amber-400 rounded-md shadow-xs cursor-pointer shrink-0 puja-btn-tap"
        >
          <Plus className="h-4 w-4" /> Add Ceremony Offering
        </Button>
      </div>

      {/* Services List Card */}
      <div className="rounded-xl border-2 border-amber-300 bg-white shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b-2 border-amber-300 bg-white">
          <h2 className="text-lg font-serif font-bold text-stone-950">Offered Ceremonies ({services.length})</h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Prices set here will be automatically presented to devotees when booking consultations with you.
          </p>
        </div>

        <div className="p-0">
          {services.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-xs text-stone-500 font-medium">You have not added any ritual offerings yet.</p>
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="text-xs gap-1.5 h-10 px-5 bg-[#780016] hover:bg-red-800 text-white font-bold rounded-md border border-amber-400 shadow-xs cursor-pointer puja-btn-tap"
              >
                <Plus className="h-4 w-4" /> Add Your First Offering
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-amber-200">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-50/20 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-base text-stone-950 font-serif">{service.serviceName}</h3>
                      <Badge
                        variant="outline"
                        className={
                          service.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold'
                            : 'bg-stone-100 text-stone-600 border-stone-300 text-[10px] font-bold'
                        }
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-600 flex items-center gap-1.5">
                      <span>Recommended Dakshina:</span>
                      <strong className="text-red-800 font-serif font-bold text-sm">₹{service.price.toLocaleString('en-IN')}</strong>
                      <span className="text-[11px] text-stone-500">(Cash on completion)</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(service)}
                      className="h-10 px-4 text-xs gap-1.5 w-full sm:w-auto rounded-md border-stone-300 hover:border-amber-400 font-bold"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-stone-600" /> Edit Rate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(service.id)}
                      className={`h-10 px-4 text-xs gap-1.5 w-full sm:w-auto rounded-md font-bold cursor-pointer ${
                        service.isActive ? 'text-stone-500 hover:text-red-700 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {service.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id, service.serviceName)}
                      className="h-10 px-3 text-xs gap-1.5 w-full sm:w-auto rounded-md font-bold text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceToEdit={editingService}
        onSubmit={handleSaveService}
      />
    </div>
  );
};

export default PriestServicesPage;
