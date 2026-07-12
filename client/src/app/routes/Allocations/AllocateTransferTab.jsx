import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button, Card, CardContent, Input, Select } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { assetsApi } from "@/features/assets/api";
import { allocationsApi } from "@/features/allocations/api";
import { allocateSchema } from "@/features/allocations/schemas";
import { transfersApi } from "@/features/transfers/api";
import { createTransferSchema } from "@/features/transfers/schemas";
import { useDepartments } from "@/features/org/hooks";
import { getApiMessage } from "@/lib/api";
import { AssetStatusBadge, STATUS_LABEL } from "@/features/assets/badges";
import { useLiveRefresh } from "@/app/hooks/useLiveRefresh";
import AssetCombobox from "./AssetCombobox";
import EmployeeCombobox from "./EmployeeCombobox";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");

const AllocationForm = ({ asset, onDone }) => {
  const { data: departments } = useDepartments();
  const [employee, setEmployee] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(allocateSchema),
    defaultValues: { allocateTo: "EMPLOYEE", userId: "", departmentId: "", expectedReturnDate: "" },
  });

  const allocateTo = watch("allocateTo");

  const onSubmit = async (values) => {
    try {
      await allocationsApi.allocate({
        assetId: asset.id,
        userId: values.allocateTo === "EMPLOYEE" ? Number(values.userId) : null,
        departmentId: values.allocateTo === "DEPARTMENT" ? Number(values.departmentId) : null,
        expectedReturnDate: values.expectedReturnDate || null,
      });
      toast.success(`${asset.assetTag} allocated.`);
      onDone();
    } catch (error) {
      toast.error(getApiMessage(error, "Could not allocate asset."));
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="radio" value="EMPLOYEE" {...register("allocateTo")} defaultChecked /> Employee
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="radio" value="DEPARTMENT" {...register("allocateTo")} /> Department
        </label>
      </div>

      {allocateTo === "EMPLOYEE" ? (
        <Controller
          control={control}
          name="userId"
          render={({ field }) => (
            <EmployeeCombobox
              value={employee}
              onChange={(emp) => {
                setEmployee(emp);
                field.onChange(emp ? String(emp.id) : "");
              }}
              placeholder="Select Employee..."
            />
          )}
        />
      ) : (
        <label className="grid gap-2 text-sm font-medium text-zinc-300">
          <span>Department</span>
          <Select {...register("departmentId")}>
            <option value="">Select department...</option>
            {departments
              .filter((d) => d.status === "ACTIVE")
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </Select>
        </label>
      )}
      {errors.userId && <span className="text-xs font-medium text-red-400">{errors.userId.message}</span>}

      <label className="grid gap-2 text-sm font-medium text-zinc-300">
        <span>Expected return date (optional)</span>
        <Input type="date" {...register("expectedReturnDate")} />
        {errors.expectedReturnDate && (
          <span className="text-xs font-medium text-red-400">{errors.expectedReturnDate.message}</span>
        )}
      </label>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Allocate Asset
      </Button>
    </form>
  );
};

const TransferForm = ({ asset, holder, onDone }) => {
  const [toEmployee, setToEmployee] = useState(null);

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createTransferSchema), defaultValues: { toUserId: "", reason: "" } });

  const onSubmit = async (values) => {
    try {
      await transfersApi.create({ assetId: asset.id, toUserId: Number(values.toUserId), reason: values.reason });
      toast.success("Transfer request submitted.");
      reset();
      setToEmployee(null);
      onDone();
    } catch (error) {
      toast.error(getApiMessage(error, "Could not submit transfer request."));
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Transfer Request</h3>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-2 text-sm font-medium text-zinc-300">
          <span>From</span>
          <Input value={holder?.name || "Unknown"} disabled readOnly />
        </label>

        <label className="grid gap-2 text-sm font-medium text-zinc-300">
          <span>To</span>
          <Controller
            control={control}
            name="toUserId"
            render={({ field }) => (
              <EmployeeCombobox
                value={toEmployee}
                excludeUserId={holder?.id}
                onChange={(emp) => {
                  setToEmployee(emp);
                  field.onChange(emp ? String(emp.id) : "");
                }}
                placeholder="Select Employee..."
              />
            )}
          />
          {errors.toUserId && <span className="text-xs font-medium text-red-400">{errors.toUserId.message}</span>}
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-zinc-300">
        <span>Reason</span>
        <Textarea placeholder="Why is this asset being transferred?" {...register("reason")} />
        {errors.reason && <span className="text-xs font-medium text-red-400">{errors.reason.message}</span>}
      </label>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Submit Request
      </Button>
    </form>
  );
};

const AllocateTransferTab = () => {
  const { user } = useSelector((state) => state.auth);
  const canManage = user.role === "ADMIN" || user.role === "ASSET_MANAGER";
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetDetail, setAssetDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialAssets, setInitialAssets] = useState([]);

  const loadDetail = useCallback((assetId, { silent = false } = {}) => {
    if (!assetId) return;
    if (!silent) setIsLoading(true);
    assetsApi
      .getById(assetId)
      .then((res) => setAssetDetail(res.payload))
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedAsset) loadDetail(selectedAsset.id);
    else setAssetDetail(null);
  }, [selectedAsset]);
  useLiveRefresh(() => loadDetail(selectedAsset?.id, { silent: true }), { enabled: Boolean(selectedAsset), deps: [selectedAsset?.id] });

  // preload a small list of available assets on mount
  useEffect(() => {
    let mounted = true;
    assetsApi
      .list({ limit: 12, status: "AVAILABLE" })
      .then((res) => {
        if (mounted) setInitialAssets(res.payload.data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const activeAllocation = assetDetail?.allocations?.find((a) => a.status === "ACTIVE");
  const isCurrentHolder = activeAllocation?.user?.id === user.id;
  const canRequestTransfer = canManage || isCurrentHolder;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-6">
        <Card>
          <CardContent>
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Asset</span>
                  <AssetCombobox value={selectedAsset} onChange={setSelectedAsset} initialResults={initialAssets} openOnMount={true} />
            </label>
          </CardContent>
        </Card>

        {assetDetail && !isLoading && (
          <>
            {assetDetail.status === "AVAILABLE" && canManage && (
              <Card>
                <CardContent>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Allocate Asset</h3>
                  <AllocationForm asset={assetDetail} onDone={() => loadDetail(assetDetail.id)} />
                </CardContent>
              </Card>
            )}

            {assetDetail.status === "AVAILABLE" && !canManage && (
              <Card>
                <CardContent>
                  <p className="text-sm text-zinc-400">
                    {assetDetail.assetTag} is available. Direct allocation is handled by Admins and Asset Managers.
                  </p>
                </CardContent>
              </Card>
            )}

            {assetDetail.status === "ALLOCATED" && (
              <>
                <div className="flex items-start gap-3 rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <span>
                    Already Allocated to <strong>{activeAllocation?.user?.name || "another employee"}</strong> (
                    {activeAllocation?.user?.department?.name || "Unassigned dept"}) &mdash; Direct re-allocation is blocked &mdash;
                    submit a transfer request below
                  </span>
                </div>

                <Card>
                  <CardContent>
                    {canRequestTransfer ? (
                      <TransferForm asset={assetDetail} holder={activeAllocation?.user} onDone={() => loadDetail(assetDetail.id)} />
                    ) : (
                      <p className="text-sm text-zinc-400">
                        Transfer requests can only be raised by the current holder, Admins, or Asset Managers.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {!["AVAILABLE", "ALLOCATED"].includes(assetDetail.status) && (
              <Card>
                <CardContent>
                  <p className="text-sm text-zinc-400">
                    {assetDetail.assetTag} is currently <AssetStatusBadge status={assetDetail.status} /> and cannot be allocated
                    directly.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Allocation history</h3>
                {assetDetail.allocations.length === 0 ? (
                  <p className="text-sm text-zinc-500">No allocation history yet.</p>
                ) : (
                  <ul className="grid gap-2 text-sm">
                    {assetDetail.allocations.map((allocation) => (
                      <li key={allocation.id} className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-300">
                        {formatDate(allocation.allocatedAt)} &mdash; {allocation.status === "ACTIVE" ? "Allocated to" : "Returned by"}{" "}
                        <strong>{allocation.user?.name || "Department allocation"}</strong>
                        {allocation.returnCondition && ` — condition: ${allocation.returnCondition.toLowerCase()}`}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="h-fit">
        <CardContent>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">How this works</h3>
          <p className="text-sm text-zinc-400">
            Search for an asset above. Available assets show an allocation form. Already-allocated assets show who holds it and let
            you submit a transfer request instead of a direct re-allocation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllocateTransferTab;
