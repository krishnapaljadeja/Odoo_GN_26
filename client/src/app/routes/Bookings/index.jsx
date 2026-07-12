import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { Button, Input, Select } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { DataState, EmptyState } from "../../components/data";
import { bookingsApi } from "@/features/bookings/api";
import { buildBookingPayload } from "@/features/bookings/schemas";
import { getApiMessage } from "@/lib/api";
import { useLiveRefresh } from "@/app/hooks/useLiveRefresh";
import BookingDialog from "./BookingDialog";

const pad = (value) => String(value).padStart(2, "0");
const toDateInput = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toTimeInput = (date) => `${pad(new Date(date).getHours())}:${pad(new Date(date).getMinutes())}`;
const timeLabel = (date) => new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const dayLabel = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

const HOURS = Array.from({ length: 9 }, (_, index) => 9 + index);
const GRID_START = 9;
const GRID_END = 17;

const statusClass = {
  UPCOMING: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  ONGOING: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  COMPLETED: "border-zinc-600 bg-zinc-800 text-zinc-300",
  CANCELLED: "border-red-500/40 bg-red-500/10 text-red-300",
};

const minutesFromDayStart = (value) => {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
};

const blockStyle = (start, end) => {
  const visibleStart = GRID_START * 60;
  const visibleEnd = GRID_END * 60;
  const top = Math.max(minutesFromDayStart(start), visibleStart) - visibleStart;
  const bottom = Math.min(minutesFromDayStart(end), visibleEnd) - visibleStart;
  return {
    top: `${(top / ((GRID_END - GRID_START) * 60)) * 100}%`,
    height: `${Math.max(7, ((bottom - top) / ((GRID_END - GRID_START) * 60)) * 100)}%`,
  };
};

const ResourceOption = ({ resource }) => `${resource.name} · ${resource.assetTag}${resource.location ? ` · ${resource.location}` : ""}`;

const Bookings = () => {
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [date, setDate] = useState(toDateInput());
  const [bookings, setBookings] = useState([]);
  const [mine, setMine] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [conflict, setConflict] = useState(null);

  const selectedResource = useMemo(
    () => resources.find((resource) => String(resource.id) === String(selectedResourceId)),
    [resources, selectedResourceId],
  );

  const loadResources = useCallback(() =>
    bookingsApi.resources().then((res) => {
      setResources(res.payload);
      setSelectedResourceId((current) => current || String(res.payload[0]?.id || ""));
    }), []);

  const loadCalendar = useCallback(() => {
    if (!selectedResourceId) return Promise.resolve();
    return bookingsApi
      .list({ assetId: selectedResourceId, date, mine: "false" })
      .then((res) => setBookings(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load bookings")));
  }, [date, selectedResourceId]);

  const loadMine = useCallback(() =>
    bookingsApi
      .list({ mine: "true", status: statusFilter || undefined, assetId: resourceFilter || undefined })
      .then((res) => setMine(res.payload))
      .catch((err) => toast.error(getApiMessage(err, "Could not load your bookings."))), [resourceFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    setError("");
    loadResources()
      .catch((err) => setError(getApiMessage(err, "Could not load bookable resources")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResourceId, date]);

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, resourceFilter]);

  const refresh = useCallback(() => Promise.all([loadCalendar(), loadMine()]), [loadCalendar, loadMine]);
  const refreshAll = useCallback(() => Promise.all([loadResources(), loadCalendar(), loadMine()]), [loadCalendar, loadMine, loadResources]);
  useLiveRefresh(refreshAll, {
    enabled: !dialogOpen,
    deps: [selectedResourceId, date, statusFilter, resourceFilter],
  });

  const handleSubmit = async (values) => {
    const resourceId = editing?.assetId || selectedResourceId;
    try {
      const payload = buildBookingPayload(resourceId, values);
      if (editing) {
        await bookingsApi.reschedule(editing.id, { startTime: payload.startTime, endTime: payload.endTime, purpose: payload.purpose });
        toast.success("Booking rescheduled.");
      } else {
        await bookingsApi.create(payload);
        toast.success("Booking confirmed.");
      }
      setConflict(null);
      setDialogOpen(false);
      setEditing(null);
      await refresh();
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === "SLOT_UNAVAILABLE") {
        setConflict({
          startTime: buildBookingPayload(resourceId, values).startTime,
          endTime: buildBookingPayload(resourceId, values).endTime,
        });
      }
      toast.error(getApiMessage(err, "Could not confirm booking."));
    }
  };

  const cancelBooking = async (booking) => {
    try {
      await bookingsApi.cancel(booking.id);
      toast.success("Booking cancelled.");
      await refresh();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not cancel booking."));
    }
  };

  const openReschedule = (booking) => {
    setEditing(booking);
    setDialogOpen(true);
  };

  const selectedResourceForDialog = editing?.asset || selectedResource;

  return (
    <DashboardLayout>
      <PageHeader
        title="Resource Booking"
        description="Book shared rooms and resources with overlap protection."
        actions={
          <Button onClick={() => setDialogOpen(true)} disabled={!selectedResourceId}>
            <CalendarClock size={16} />
            Book a slot
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={selectedResourceId} onChange={(e) => setSelectedResourceId(e.target.value)} className="min-w-[18rem] max-w-sm">
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {ResourceOption({ resource })}
            </option>
          ))}
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[11rem]" />
        <span className="text-sm text-zinc-400">
          {selectedResource ? `${selectedResource.name} - ${dayLabel(date)}` : "No bookable resources"}
        </span>
      </div>

      <DataState
        isLoading={loading}
        error={error}
        isEmpty={!loading && resources.length === 0}
        empty={<EmptyState title="No bookable resources yet" description="Mark an asset as shared/bookable from the asset directory." />}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-100">Day view</h2>
            </div>
            <div className="relative grid min-h-[36rem] grid-cols-[4rem_minmax(0,1fr)]">
              <div className="border-r border-zinc-800">
                {HOURS.map((hour) => (
                  <div key={hour} className="h-16 border-b border-zinc-900 px-3 py-2 text-xs text-zinc-500">
                    {hour}:00
                  </div>
                ))}
              </div>
              <div className="relative">
                {HOURS.map((hour) => (
                  <div key={hour} className="h-16 border-b border-zinc-900" />
                ))}

                {bookings
                  .filter((booking) => booking.status !== "CANCELLED")
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="absolute left-4 right-4 overflow-hidden rounded-md border border-sky-400/40 bg-sky-500/20 px-3 py-2 text-xs text-sky-100"
                      style={blockStyle(booking.startTime, booking.endTime)}
                    >
                      <div className="font-semibold">Booked - {booking.purpose || booking.user?.name || "Reserved"}</div>
                      <div className="text-sky-200">
                        {timeLabel(booking.startTime)} to {timeLabel(booking.endTime)}
                      </div>
                    </div>
                  ))}

                {conflict && (
                  <div
                    className="absolute left-4 right-4 rounded-md border border-dashed border-red-400 bg-red-950/40 px-3 py-2 text-xs text-red-200"
                    style={blockStyle(conflict.startTime, conflict.endTime)}
                  >
                    Requested {timeLabel(conflict.startTime)} to {timeLabel(conflict.endTime)}: conflict - slot is unavailable
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-100">My bookings</h2>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[9rem]">
                <option value="">All statuses</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
              <Select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} className="min-w-[11rem]">
                <option value="">All resources</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="divide-y divide-zinc-800">
              {mine.length === 0 ? (
                <div className="p-4 text-sm text-zinc-500">No bookings match those filters.</div>
              ) : (
                mine.map((booking) => (
                  <div key={booking.id} className="grid gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-zinc-100">{booking.asset.name}</div>
                        <div className="text-xs text-zinc-500">
                          {dayLabel(toDateInput(new Date(booking.startTime)))} · {timeLabel(booking.startTime)} to {timeLabel(booking.endTime)}
                        </div>
                      </div>
                      <Badge className={statusClass[booking.status] || statusClass.UPCOMING}>{booking.status}</Badge>
                    </div>
                    {booking.purpose && <div className="text-sm text-zinc-400">{booking.purpose}</div>}
                    {["UPCOMING", "ONGOING"].includes(booking.status) && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openReschedule(booking)}>
                          <RotateCcw size={14} />
                          Reschedule
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => cancelBooking(booking)}>
                          <XCircle size={14} />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DataState>

      <BookingDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        resource={selectedResourceForDialog}
        date={date}
        title={editing ? "Reschedule booking" : "Book a slot"}
        initialValues={
          editing
            ? {
                date: toDateInput(new Date(editing.startTime)),
                startTime: toTimeInput(editing.startTime),
                endTime: toTimeInput(editing.endTime),
                purpose: editing.purpose || "",
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
};

export default Bookings;
