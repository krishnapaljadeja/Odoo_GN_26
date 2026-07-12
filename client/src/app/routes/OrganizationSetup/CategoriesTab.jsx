import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DataState, EmptyState } from "../../components/data";
import { FormField } from "../../components/forms";
import { orgApi } from "@/features/org/api";
import { useCategories } from "@/features/org/hooks";
import { getApiMessage } from "@/lib/api";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  customFieldsText: z.string().optional().refine(
    (value) => {
      if (!value || !value.trim()) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be valid JSON, e.g. {\"warrantyMonths\": 12}" },
  ),
});

const CategoryDialog = ({ open, onOpenChange, category, onSaved }) => {
  const isEdit = Boolean(category);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "", customFieldsText: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name || "",
        description: category?.description || "",
        customFieldsText: category?.customFields ? JSON.stringify(category.customFields) : "",
      });
    }
  }, [open, category, reset]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      customFields: values.customFieldsText?.trim() ? JSON.parse(values.customFieldsText) : null,
    };

    try {
      if (isEdit) {
        await orgApi.updateCategory(category.id, payload);
        toast.success("Category updated.");
      } else {
        await orgApi.createCategory(payload);
        toast.success("Category created.");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiMessage(error, "Could not save category."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Name" placeholder="Electronics" {...register("name")} error={errors.name?.message} />
          <FormField
            label="Description"
            placeholder="Laptops, monitors, projectors..."
            {...register("description")}
            error={errors.description?.message}
          />

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Custom fields (JSON, optional)</span>
            <Textarea placeholder='{"warrantyMonths": 12}' {...register("customFieldsText")} />
            {errors.customFieldsText && (
              <span className="text-xs font-medium text-red-400">{errors.customFieldsText.message}</span>
            )}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CategoriesTab = ({ registerAddAction }) => {
  const { data: categories, isLoading, error, refetch } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    registerAddAction(() => {
      setEditing(null);
      setDialogOpen(true);
    });
  }, [registerAddAction]);

  return (
    <div>
      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={categories.length === 0}
        empty={
          <EmptyState
            title="No categories yet"
            description="Create asset categories like Electronics, Furniture or Vehicles."
            actionLabel="Add category"
            onAction={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          />
        }
      >
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3"># Assets</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {categories.map((category) => (
                  <tr key={category.id} className="text-zinc-200">
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{category.description || "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{category.assetCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(category);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} onSaved={refetch} />
    </div>
  );
};

export default CategoriesTab;
