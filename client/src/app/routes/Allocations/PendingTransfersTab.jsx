import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { DataState, EmptyState } from "../../components/data";
import { transfersApi } from "@/features/transfers/api";
import { getApiMessage } from "@/lib/api";
import { useLiveRefresh } from "@/app/hooks/useLiveRefresh";

const formatDate = (value) => new Date(value).toLocaleString();

const PendingTransfersTab = () => {
  const { user } = useSelector((state) => state.auth);
  const canDecide = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(user.role);

  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError("");
    transfersApi
      .list({ status: "REQUESTED", limit: 50 })
      .then((res) => setTransfers(res.payload.data))
      .catch((err) => setError(getApiMessage(err, "Could not load transfer requests")))
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }, []);

  useEffect(load, []);
  useLiveRefresh(load);

  const approve = async (transfer) => {
    try {
      await transfersApi.approve(transfer.id);
      toast.success(`Transfer approved: ${transfer.asset.assetTag} to ${transfer.toUser.name}.`);
      load();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not approve transfer."));
    }
  };

  const reject = async (transfer) => {
    try {
      await transfersApi.reject(transfer.id);
      toast.success("Transfer rejected.");
      load();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not reject transfer."));
    }
  };

  return (
    <DataState
      isLoading={isLoading}
      error={error}
      isEmpty={transfers.length === 0}
      empty={<EmptyState title="No pending transfer requests" />}
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ul className="grid gap-3">
          {transfers.map((transfer) => (
            <li key={transfer.id} className="rounded-lg border border-zinc-800 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-100">
                    {transfer.asset.assetTag} &middot; {transfer.asset.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {transfer.fromUser.name} &rarr; {transfer.toUser.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">&ldquo;{transfer.reason}&rdquo;</p>
                  <p className="mt-1 text-xs text-zinc-600">Requested {formatDate(transfer.createdAt)}</p>
                </div>
                {canDecide && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve(transfer)}>
                      <Check size={14} />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(transfer)}>
                      <X size={14} />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DataState>
  );
};

export default PendingTransfersTab;
