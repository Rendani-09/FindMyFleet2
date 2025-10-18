import { useEffect, useState, useMemo } from "react";
import { Plus, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm, Controller } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

type MaintenanceForm = {
  vehicle: string;
  service: string;
  date: Date | null;
  cost: number;
  provider: string;
};

export default function Maintenance() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [scheduledVehicles, setScheduledVehicles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<MaintenanceForm>({
    defaultValues: {
      vehicle: "",
      service: "",
      date: null,
      cost: 0,
      provider: "",
    },
  });
  const todayStr = new Date().toISOString().split("T")[0];

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("maintenance").select("*");
    if (error) console.error(error);
    else setLogs(data);
    setLoading(false);
  };

  const fetchScheduledVehicles = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("maintenance")
      .select("vehicle, date")
      .gte("date", today);
    if (!error && data) {
      const uniquePlates = Array.from(new Set(data.map((row: any) => row.vehicle)));
      setScheduledVehicles(uniquePlates);
    }
  };

  // Compute the next scheduled service (earliest future date) per vehicle
  const nextServiceMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!logs || logs.length === 0) return map;
    const today = new Date().toISOString().split("T")[0];
    for (const l of logs) {
      if (!l || !l.date) continue;
      // consider future or today as scheduled
      if (l.date >= today) {
        const plate = l.vehicle;
        if (!map[plate] || l.date < map[plate]) map[plate] = l.date;
      }
    }
    return map;
  }, [logs]);

  useEffect(() => {
    fetchLogs();
    // Fetch vehicles for dropdown
    const fetchVehicles = async () => {
      const { data, error } = await supabase.from("vehicles").select("*");
      if (!error) setVehicles(data || []);
    };
    fetchVehicles();
    // Fetch scheduled vehicles (future maintenance)
    fetchScheduledVehicles();
  }, []);

  const onSubmit = async (values: MaintenanceForm) => {
    setSubmitting(true);
    setError(null);
    let dateString = null;
    if (values.date instanceof Date && !isNaN(values.date.getTime())) {
      dateString = values.date.toISOString().split("T")[0];
    } else if (typeof values.date === "string" && values.date) {
      dateString = values.date;
    }
    if (!dateString) {
      setError("Date is required.");
      setSubmitting(false);
      return;
    }
    // Prevent logging for past dates
    if (dateString < todayStr) {
      setError("Cannot log a service with a past date.");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("maintenance").insert([
      {
        ...values,
        date: dateString,
      },
    ]);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setOpen(false);
      form.reset();
      fetchLogs();
    }
  };

  if (loading) return <p>Loading maintenance logs...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Maintenance Management</h1>
          <p className="text-muted-foreground mt-1">Track and schedule vehicle maintenance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setScheduleOpen(true)}><CalendarIcon className="mr-2 h-4 w-4" /> Schedule Service</Button>
      {/* Schedule Service Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Maintenance Service</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async e => {
              e.preventDefault();
              setSubmitting(true);
              setError(null);
              const formData = new FormData(e.currentTarget);
              const vehicle = formData.get("vehicle") as string;
              const service = formData.get("service") as string;
              const date = formData.get("date") as string;
              if (!vehicle || !service || !date) {
                setError("All fields are required.");
                setSubmitting(false);
                return;
              }
              // Prevent scheduling in the past
              if (date < todayStr) {
                setError("Cannot schedule a service on a past date.");
                setSubmitting(false);
                return;
              }
              const { error } = await supabase.from("maintenance").insert([
                {
                  vehicle,
                  service,
                  date,
                  cost: 0,
                  provider: "",
                },
              ]);
              setSubmitting(false);
              if (error) {
                setError(error.message);
              } else {
                setScheduleOpen(false);
                fetchLogs();
                // refresh scheduled list so new schedule appears in Log dialog
                fetchScheduledVehicles();
              }
            }}
          >
            <div>
              <label className="block mb-1 font-medium">Vehicle</label>
              <select name="vehicle" className="input w-full" required>
                <option value="">Select a vehicle</option>
                {vehicles.map((v: any) => (
                  <option key={v.id} value={v.plate}>{v.plate} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Service Type</label>
              <Input name="service" placeholder="Service Type" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Scheduled Date</label>
              <Input name="date" type="date" required min={todayStr} />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Scheduling..." : "Schedule"}
              </Button>
            </DialogFooter>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </DialogContent>
      </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" /> Log Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Maintenance Service</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField name="vehicle" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <select {...field} required className="input">
                          <option value="">Select a vehicle</option>
                          {vehicles
                            .filter((v: any) => scheduledVehicles.includes(v.plate))
                            .map((v: any) => (
                              <option key={v.id} value={v.plate}>{v.plate} - {v.make} {v.model}</option>
                            ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="service" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Service Type" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="date" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Controller
                          control={form.control}
                          name="date"
                          render={({ field: { onChange, value } }) => (
                            <Calendar
                              mode="single"
                              selected={value}
                              onSelect={onChange}
                              className="rounded-md border"
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField name="cost" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (R)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="Amount in Rands" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="provider" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="Service Provider" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="submit" disabled={submitting} className="w-full">
                      {submitting ? "Logging..." : "Log Service"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Next Service</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Service Provider</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(log => {
                const nextService = nextServiceMap[log.vehicle] || null;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.vehicle}</TableCell>
                    <TableCell>{log.service}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{nextService ? nextService : "-"}</TableCell>
                    <TableCell className="font-semibold text-success">{log.cost}</TableCell>
                    <TableCell>{log.provider}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
