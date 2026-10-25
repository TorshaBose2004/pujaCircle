import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  priestServiceSchema,
  PriestServiceInput,
} from "@/schemas/priest.schema";
import { PriestService } from "@/types/priest.types";
import { PujaCatalogEntry } from "@/types/catalog.types";
import { catalogApi } from "@/api/catalog.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, Loader2 } from "lucide-react";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit?: PriestService | null;
  onSubmit: (data: PriestServiceInput) => Promise<void>;
  isLoading?: boolean;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  serviceToEdit,
  onSubmit,
  isLoading = false,
}) => {
  const [catalog, setCatalog] = useState<PujaCatalogEntry[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PriestServiceInput>({
    resolver: zodResolver(priestServiceSchema),
    defaultValues: {
      serviceName: "",
      pujaCatalogId: "",
      price: 2500,
      isCustom: false,
      category: "General",
    },
  });

  const watchServiceName = watch("serviceName");
  const watchCatalogId = watch("pujaCatalogId");
  const watchPrice = watch("price");

  const isFormValid = Boolean(
    (serviceToEdit ? watchServiceName?.trim() : (watchCatalogId && watchServiceName?.trim())) &&
    Number(watchPrice) > 0
  );

  // Load master puja catalog when modal is opened for adding a new service
  useEffect(() => {
    if (isOpen && !serviceToEdit && catalog.length === 0) {
      setIsCatalogLoading(true);
      catalogApi
        .getCatalog()
        .then((items) => setCatalog(items || []))
        .finally(() => setIsCatalogLoading(false));
    }
  }, [isOpen, serviceToEdit, catalog.length]);

  useEffect(() => {
    if (!isOpen) return;

    if (serviceToEdit) {
      reset({
        serviceName: serviceToEdit.serviceName,
        pujaCatalogId: serviceToEdit.pujaCatalogId || "",
        price: serviceToEdit.price,
        isCustom: false,
        category: serviceToEdit.category || "General",
        samagriList: serviceToEdit.samagriList || [],
      });
    } else {
      reset({
        serviceName: "",
        pujaCatalogId: "",
        price: 2500,
        isCustom: false,
        category: "General",
        samagriList: [],
      });
    }
  }, [serviceToEdit, reset, isOpen]);

  const handleSelectCatalogItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catalogId = e.target.value;
    const item = catalog.find((c) => c.id === catalogId);
    if (item) {
      setValue("pujaCatalogId", item.id, { shouldValidate: true });
      setValue("serviceName", item.name, { shouldValidate: true });
      setValue("category", item.category || "General");
      setValue("samagriList", item.samagriList || []);
    } else {
      setValue("pujaCatalogId", "", { shouldValidate: true });
      setValue("serviceName", "", { shouldValidate: true });
    }
  };

  const handleFormSubmit = async (data: PriestServiceInput) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            {serviceToEdit
              ? "Edit Ceremony Offering"
              : "Add New Ceremony Offering"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {serviceToEdit
              ? "Update your recommended cash dakshina rate for this ceremony."
              : "Select a ceremony from the sacred puja catalog and enter your recommended cash dakshina amount."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 pt-2"
        >
          {/* Ceremony Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Ceremony Name</Label>
            {serviceToEdit ? (
              <Input
                value={serviceToEdit.serviceName}
                readOnly
                className="text-xs bg-muted/50 cursor-not-allowed text-stone-700 font-medium"
              />
            ) : isCatalogLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input text-xs text-stone-500 bg-stone-50">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                <span>Loading sacred ceremonies from catalog...</span>
              </div>
            ) : (
              <select
                value={watchCatalogId || ""}
                onChange={handleSelectCatalogItem}
                className="w-full h-10 px-3 py-2 text-xs rounded-md border border-input bg-white shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-stone-900 cursor-pointer"
              >
                <option value="">-- Select Ceremony from Puja Catalog --</option>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.durationMinutes ? `(${item.durationMinutes} mins)` : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.serviceName && (
              <p className="text-[11px] text-destructive">
                {errors.serviceName.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Recommended Cash Dakshina (₹ INR)
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="2500"
                {...register("price")}
                className="pl-9 text-xs font-semibold"
              />
            </div>
            {errors.price && (
              <p className="text-[11px] text-destructive">
                {errors.price.message}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Direct offline cash amount devotees will offer upon ceremony
              completion.
            </p>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-md border-2 border-amber-300 text-stone-800 hover:bg-amber-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !isFormValid}
              className="text-xs font-bold bg-[#780016] hover:bg-[#600012] text-white h-9 px-4 rounded-md shadow-xs border border-amber-400 cursor-pointer disabled:opacity-50"
            >
              {isLoading
                ? "Saving..."
                : serviceToEdit
                  ? "Update Offering"
                  : "Save Offering"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
