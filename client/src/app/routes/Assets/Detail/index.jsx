import React, { useCallback, useEffect, useState } from "react";
import { useParams, useHistory, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Pencil, ShieldAlert } from "lucide-react";
import { DashboardLayout, PageHeader } from "../../../components/layout";
import { Button, Card, CardContent } from "../../../components/ui";
import { DataState, EmptyState } from "../../../components/data";
import { assetsApi } from "@/features/assets/api";
import { AssetStatusBadge, CONDITION_LABEL } from "@/features/assets/badges";
import { useDepartments, useCategories } from "@/features/org/hooks";
import { getApiMessage, toAbsoluteUploadUrl } from "@/lib/api";
import { useLiveRefresh } from "@/app/hooks/useLiveRefresh";
import RegisterAssetDialog from "../RegisterAssetDialog";
import StatusChangeDialog from "./StatusChangeDialog";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "—");

const SectionCard = ({ title, children }) => (
  <Card>
    <CardContent>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
      {children}
    </CardContent>
  </Card>
);

const AssetDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const role = useSelector((state) => state.auth.user.role);
  const canManage = role === "ADMIN" || role === "ASSET_MANAGER";

  const { data: categories } = useCategories();
  const { data: departments } = useDepartments();

  const [asset, setAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const load = useCallback(({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError("");
    assetsApi
      .getById(id)
      .then((res) => setAsset(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load asset")))
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }, [id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [id]);
  useLiveRefresh(load, { enabled: !editOpen && !statusOpen, deps: [id] });

  return (
    <DashboardLayout>
      <button
        type="button"
        onClick={() => history.push("/assets")}
        className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
      >
        <ArrowLeft size={14} />
        Back to Assets
      </button>

      <DataState isLoading={isLoading} error={error} isEmpty={false}>
        {asset && (
          <>
            <PageHeader
              title={
                <span className="flex items-center gap-3">
                  {asset.assetTag} &middot; {asset.name}
                  <AssetStatusBadge status={asset.status} />
                </span>
              }
              description={`${asset.category?.name || "Uncategorized"} - ${asset.location || "No location set"}`}
              actions={
                canManage && (
                  <>
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                      <Pencil size={16} />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => setStatusOpen(true)}>
                      <ShieldAlert size={16} />
                      Change status
                    </Button>
                  </>
                )
              }
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
              <div className="grid gap-6">
                <SectionCard title="Details">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="text-zinc-500">Serial number</dt>
                      <dd className="text-zinc-200">{asset.serialNumber || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Condition</dt>
                      <dd className="text-zinc-200">{CONDITION_LABEL[asset.condition]}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Department</dt>
                      <dd className="text-zinc-200">{asset.department?.name || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Bookable</dt>
                      <dd className="text-zinc-200">{asset.isBookable ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Acquisition date</dt>
                      <dd className="text-zinc-200">{formatDate(asset.acquisitionDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Acquisition cost</dt>
                      <dd className="text-zinc-200">{asset.acquisitionCost ? `₹${asset.acquisitionCost}` : "—"}</dd>
                    </div>
                  </dl>
                  {asset.photoUrl && (
                    <img
                      src={toAbsoluteUploadUrl(asset.photoUrl)}
                      alt={asset.name}
                      className="mt-4 max-h-48 rounded-md border border-zinc-800 object-cover"
                    />
                  )}
                </SectionCard>

                <SectionCard title="Allocation history">
                  {asset.allocations.length === 0 ? (
                    <EmptyState title="No allocation history yet" />
                  ) : (
                    <ul className="grid gap-2 text-sm">
                      {asset.allocations.map((allocation) => (
                        <li key={allocation.id} className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-300">
                          <span className="font-medium text-zinc-100">{allocation.user?.name || "Department allocation"}</span>{" "}
                          &middot; {formatDate(allocation.allocatedAt)}
                          {allocation.returnedAt && ` - returned ${formatDate(allocation.returnedAt)}`}
                          {allocation.returnCondition && ` (condition: ${allocation.returnCondition.toLowerCase()})`}
                          <span className="ml-2 text-xs text-zinc-500">[{allocation.status}]</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard title="Maintenance history">
                  {asset.maintenance.length === 0 ? (
                    <EmptyState title="No maintenance requests yet" />
                  ) : (
                    <ul className="grid gap-2 text-sm">
                      {asset.maintenance.map((request) => (
                        <li key={request.id} className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-300">
                          {request.description} <span className="ml-2 text-xs text-zinc-500">[{request.status}]</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                {asset.isBookable && (
                  <SectionCard title="Bookings">
                    {asset.bookings.length === 0 ? (
                      <EmptyState title="No bookings yet" />
                    ) : (
                      <ul className="grid gap-2 text-sm">
                        {asset.bookings.map((booking) => (
                          <li key={booking.id} className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-300">
                            {booking.user?.name} &middot; {formatDateTime(booking.startTime)} -{" "}
                            {new Date(booking.endTime).toLocaleTimeString()}{" "}
                            <span className="ml-2 text-xs text-zinc-500">[{booking.status}]</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>
                )}

                <SectionCard title="Audit results">
                  {asset.auditItems.length === 0 ? (
                    <EmptyState title="No audit results yet" />
                  ) : (
                    <ul className="grid gap-2 text-sm">
                      {asset.auditItems.map((item) => (
                        <li key={item.id} className="rounded-md border border-zinc-800 px-3 py-2 text-zinc-300">
                          <Link to={`/audits/${item.cycle.id}`} className="text-emerald-400 hover:underline">
                            {item.cycle.title}
                          </Link>{" "}
                          <span className="ml-2 text-xs text-zinc-500">[{item.result}]</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              <SectionCard title="QR Code">
                <img
                  src={assetsApi.qrCodeUrl(asset.id)}
                  alt={`QR code for ${asset.assetTag}`}
                  className="w-full rounded-md border border-zinc-800 bg-white p-2"
                />
                <p className="mt-2 text-center text-xs text-zinc-500">Scan to search by {asset.assetTag}</p>
              </SectionCard>
            </div>

            <RegisterAssetDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              categories={categories}
              departments={departments}
              asset={asset}
              onSaved={load}
            />
            <StatusChangeDialog open={statusOpen} onOpenChange={setStatusOpen} asset={asset} onSaved={load} />
          </>
        )}
      </DataState>
    </DashboardLayout>
  );
};

export default AssetDetail;
