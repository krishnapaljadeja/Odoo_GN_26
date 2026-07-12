import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AppShell, PageHeader } from "../../components/layout";
import { DataState, EmptyState } from "../../components/data";
import { FormField, FormSection } from "../../components/forms";
import { Button } from "../../components/ui";
import { getApiMessage } from "@/lib/api";
import { exampleApi } from "@/features/example/api";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const TemplateRoute = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    exampleApi
      .list()
      .then((data) => {
        if (mounted) setItems(data.payload || []);
      })
      .catch((err) => {
        if (mounted) setError(getApiMessage(err, "Could not load items"));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (values) => {
    try {
      const data = await exampleApi.create(values);
      setItems((current) => [data.payload, ...current]);
      form.reset();
      toast.success("Created");
    } catch (err) {
      toast.error(getApiMessage(err, "Could not create item"));
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Feature Template"
        description="Copy this route when the problem statement gives you a new entity or workflow."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <DataState
          isLoading={isLoading}
          error={error}
          isEmpty={items.length === 0}
          empty={<EmptyState title="No items yet" description="Create one from the starter form." />}
        >
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-950">{item.name}</p>
              </div>
            ))}
          </div>
        </DataState>

        <FormSection title="Create Item" description="Example react-hook-form + zod setup.">
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              label="Name"
              name="name"
              placeholder="Example item"
              {...form.register("name")}
              error={form.formState.errors.name?.message}
            />
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              Create
            </Button>
          </form>
        </FormSection>
      </div>
    </AppShell>
  );
};

export default TemplateRoute;
