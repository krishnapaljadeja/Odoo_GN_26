import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { Button, Select } from "@/components/ui";
import { DataState } from "../../components/data";
import { reportsApi } from "@/features/reports/api";
import { getApiMessage } from "@/lib/api";

const Bar = ({ value, max = 100, label }) => (
  <div className="grid gap-1">
    <div className="flex justify-between text-xs text-zinc-400">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-2 rounded-full bg-zinc-800">
      <div className="h-2 rounded-full bg-amber-500" style={{ width: `${Math.min(100, max ? (value / max) * 100 : 0)}%` }} />
    </div>
  </div>
);

const ChartCard = ({ title, children, action }) => (
  <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const Reports = () => {
  const [groupBy, setGroupBy] = useState("department");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError("");
    Promise.all([
      reportsApi.utilization({ groupBy }),
      reportsApi.maintenanceFrequency(),
      reportsApi.mostUsed(),
      reportsApi.idle({ days: 45 }),
      reportsApi.dueSoon(),
      reportsApi.bookingHeatmap(),
      reportsApi.allocationSummary(),
    ])
      .then(([utilization, maintenance, mostUsed, idle, dueSoon, heatmap, allocation]) =>
        setData({
          utilization: utilization.payload,
          maintenance: maintenance.payload,
          mostUsed: mostUsed.payload,
          idle: idle.payload,
          dueSoon: dueSoon.payload,
          heatmap: heatmap.payload,
          allocation: allocation.payload,
        }),
      )
      .catch((err) => setError(getApiMessage(err, "Could not load reports")))
      .finally(() => setIsLoading(false));
  }, [groupBy]);

  const maxMaintenance = useMemo(() => Math.max(1, ...(data?.maintenance || []).map((row) => row.count)), [data]);
  const heatMax = useMemo(() => Math.max(1, ...Object.values(data?.heatmap || {})), [data]);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16];

  return (
    <DashboardLayout>
      <PageHeader title="Reports & Analytics" description="Utilization, maintenance frequency, idle assets, and booking demand." />

      <DataState isLoading={isLoading} error={error} isEmpty={false}>
        {data && (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="max-w-[13rem]">
                <option value="department">By department</option>
                <option value="category">By category</option>
              </Select>
              <a href={reportsApi.exportUrl("utilization")}>
                <Button variant="outline" size="sm">
                  <Download size={14} />
                  Export report
                </Button>
              </a>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ChartCard title="Utilization">
                <div className="grid gap-3">
                  {data.utilization.length === 0 ? (
                    <p className="text-sm text-zinc-500">No utilization data for this scope.</p>
                  ) : (
                    data.utilization.map((row) => (
                      <Bar key={row.label} label={`${row.label} (${row.allocated}/${row.total})`} value={row.utilization} />
                    ))
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Maintenance Frequency">
                <div className="grid gap-3">
                  {data.maintenance.length === 0 ? (
                    <p className="text-sm text-zinc-500">No maintenance requests yet.</p>
                  ) : (
                    data.maintenance.map((row) => <Bar key={row.label} label={row.label} value={row.count} max={maxMaintenance} />)
                  )}
                </div>
              </ChartCard>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <ChartCard title="Most used assets">
                <div className="grid gap-3 text-sm">
                  {data.mostUsed.bookings.length === 0 && data.mostUsed.allocations.length === 0 ? (
                    <p className="text-sm text-zinc-500">No usage data yet.</p>
                  ) : (
                    <>
                      {data.mostUsed.bookings.map((row) => (
                        <div key={`b-${row.asset.id}`} className="text-zinc-300">
                          {row.asset.name} {row.asset.assetTag}: <span className="text-zinc-500">{row.count} bookings</span>
                        </div>
                      ))}
                      {data.mostUsed.allocations.map((row) => (
                        <div key={`a-${row.asset.id}`} className="text-zinc-300">
                          {row.asset.name} {row.asset.assetTag}: <span className="text-zinc-500">{row.count} allocations</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Idle assets">
                <div className="grid gap-3 text-sm">
                  {data.idle.length === 0 ? (
                    <p className="text-sm text-zinc-500">No idle assets found.</p>
                  ) : (
                    data.idle.map((asset) => (
                      <div key={asset.id} className="text-zinc-300">
                        {asset.name} {asset.assetTag}: <span className="text-zinc-500">unused {asset.idleDays}+ days</span>
                      </div>
                    ))
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Due for maintenance / retirement">
                <div className="grid gap-3 text-sm">
                  {data.dueSoon.length === 0 ? (
                    <p className="text-sm text-zinc-500">No assets currently due.</p>
                  ) : (
                    data.dueSoon.map((asset) => (
                      <div key={asset.id} className="text-zinc-300">
                        {asset.name} {asset.assetTag}: <span className="text-zinc-500">{asset.condition.toLowerCase()} condition</span>
                      </div>
                    ))
                  )}
                </div>
              </ChartCard>
            </div>

            <ChartCard title="Booking heatmap">
              <div className="overflow-x-auto">
                <div className="grid min-w-[42rem] grid-cols-[4rem_repeat(8,1fr)] gap-1 text-xs">
                  <div />
                  {hours.map((hour) => <div key={hour} className="text-center text-zinc-500">{hour}:00</div>)}
                  {weekdays.map((day, dayIndex) => (
                    <React.Fragment key={day}>
                      <div className="py-2 text-zinc-500">{day}</div>
                      {hours.map((hour) => {
                        const value = data.heatmap[`${dayIndex}-${hour}`] || 0;
                        return (
                          <div
                            key={`${day}-${hour}`}
                            className="rounded border border-zinc-800 py-2 text-center text-zinc-200"
                            style={{ backgroundColor: `rgba(242,178,90,${0.08 + (value / heatMax) * 0.55})` }}
                          >
                            {value}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Department allocation summary" action={<BarChart3 size={16} className="text-zinc-500" />}>
              <div className="grid gap-2">
                {data.allocation.length === 0 ? (
                  <p className="text-sm text-zinc-500">No allocation summary available.</p>
                ) : (
                  data.allocation.map((row) => (
                    <div key={row.label} className="flex justify-between rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-300">
                      <span>{row.label}</span>
                      <span>{row.allocated}/{row.total} allocated</span>
                    </div>
                  ))
                )}
              </div>
            </ChartCard>
          </div>
        )}
      </DataState>
    </DashboardLayout>
  );
};

export default Reports;
