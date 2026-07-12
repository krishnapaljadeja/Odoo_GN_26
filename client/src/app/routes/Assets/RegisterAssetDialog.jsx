import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { Button, Select, Switch } from "@/components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormField } from "../../components/forms";
import { assetsApi, uploadFile } from "@/features/assets/api";
import { assetFormSchema } from "@/features/assets/schemas";
import { getApiMessage } from "@/lib/api";

const CONDITION_OPTIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"];

const emptyDefaults = {
  name: "",
  categoryId: "",
  serialNumber: "",
  acquisitionDate: "",
  acquisitionCost: "",
  condition: "GOOD",
  location: "",
  departmentId: "",
  isBookable: false,
  photoUrl: "",
};

const toFormValues = (asset) =>
  asset
    ? {
        name: asset.name || "",
        categoryId: String(asset.categoryId || ""),
        serialNumber: asset.serialNumber || "",
        acquisitionDate: asset.acquisitionDate ? asset.acquisitionDate.slice(0, 10) : "",
        acquisitionCost: asset.acquisitionCost ? String(asset.acquisitionCost) : "",
        condition: asset.condition,
        location: asset.location || "",
        departmentId: asset.departmentId ? String(asset.departmentId) : "",
        isBookable: asset.isBookable,
        photoUrl: asset.photoUrl || "",
      }
    : emptyDefaults;

const RegisterAssetDialog = ({ open, onOpenChange, categories, departments, onSaved, asset }) => {
  const isEdit = Boolean(asset);
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(assetFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (open) reset(toFormValues(asset));
  }, [open, asset, reset]);

  // Prevent body/page scroll when dialog is open so only the dialog content scrolls
  useEffect(() => {
    const original = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original || "";
    };
  }, [open]);

  const close = () => {
    setPhotoFile(null);
    onOpenChange(false);
  };

  const onSubmit = async (values) => {
    try {
      let photoUrl = values.photoUrl || "";

      if (photoFile) {
        setIsUploading(true);
        photoUrl = await uploadFile(photoFile);
        setIsUploading(false);
      }

      const payload = {
        name: values.name,
        categoryId: Number(values.categoryId),
        serialNumber: values.serialNumber || null,
        acquisitionDate: values.acquisitionDate || null,
        acquisitionCost: values.acquisitionCost ? Number(values.acquisitionCost) : null,
        condition: values.condition,
        location: values.location || null,
        departmentId: values.departmentId ? Number(values.departmentId) : null,
        isBookable: values.isBookable,
        photoUrl: photoUrl || null,
      };

      if (isEdit) {
        await assetsApi.update(asset.id, payload);
        toast.success("Asset updated.");
      } else {
        await assetsApi.create(payload);
        toast.success("Asset registered.");
      }

      onSaved();
      close();
    } catch (error) {
      setIsUploading(false);
      toast.error(getApiMessage(error, isEdit ? "Could not update asset." : "Could not register asset."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh]" onClose={close}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Asset" : "Register Asset"}</DialogTitle>
        </DialogHeader>

        <div className="pr-2">
          <form className="grid gap-4 grid-cols-1 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
          {!isEdit && <p className="text-xs text-zinc-500 md:col-span-2">Asset tag is auto-generated on save.</p>}

          <FormField className="md:col-span-2" label="Name" placeholder="Dell Laptop" {...register("name")} error={errors.name?.message} />

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Category</span>
            <Select {...register("categoryId")}>
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.categoryId && <span className="text-xs font-medium text-red-400">{errors.categoryId.message}</span>}
          </label>

          <FormField label="Serial number (optional)" placeholder="SN-1234-AB" {...register("serialNumber")} error={errors.serialNumber?.message} />

          <div className="grid grid-cols-2 gap-4 items-end">
            <FormField
              label="Acquisition date"
              type="date"
              {...register("acquisitionDate")}
              error={errors.acquisitionDate?.message}
            />
            <FormField
              label="Acquisition cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("acquisitionCost")}
              error={errors.acquisitionCost?.message}
            />
          </div>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Condition</span>
            <Select {...register("condition")}>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
          <FormField label="Location" placeholder="HQ Floor 2" {...register("location")} error={errors.location?.message} />

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Department (optional)</span>
            <Select {...register("departmentId")}>
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </label>

          <div className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2 md:col-span-2">
            <span className="text-sm font-medium text-zinc-300">Shared / bookable resource</span>
            <Controller
              control={control}
              name="isBookable"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>

          <label className="grid gap-2 text-sm font-medium text-zinc-300 md:col-span-2">
            <span>Photo (jpg/png, max 5MB)</span>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-500">
              <ImagePlus size={16} />
              {photoFile ? photoFile.name : isEdit && asset?.photoUrl ? "Replace current photo" : "Choose a file"}
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
            </label>
          </label>

          <DialogFooter className="md:col-span-2 justify-center">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || isUploading}>
              {isEdit ? "Save changes" : "Register Asset"}
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterAssetDialog;
