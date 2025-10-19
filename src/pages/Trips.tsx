import { useEffect, useState } from "react";
import { Plus, MapPin, Clock, CheckCircle2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

type TripForm = {
  vehicle: string;
  driver_id: number | '';
  origin: string;
  destination: string;
  date: Date | null;
  status: string;
};

export default function Trips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  // Keep a full drivers list (all drivers) to resolve names for historic trips
  const [allDrivers, setAllDrivers] = useState<any[]>([]);

  // Helper to get driver name by id
  const getDriverName = (id: number | null | undefined) => {
    if (id == null) return 'Unassigned';
    let d = allDrivers.find((d: any) => d.id === id);
    if (!d) d = drivers.find((d: any) => d.id === id);
    return d ? d.name : `ID ${id}`;
  };
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TripForm>({
    defaultValues: {
      vehicle: "",
      driver_id: '',
      origin: "",
      destination: "",
      date: new Date(),
      status: "active",
    },
  });

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("trips").select("*").order('id', { ascending: true });
    if (error) console.error(error);
    else setTrips(data);
    setLoading(false);
  };

  const fetchVehicles = async () => {
    const { data, error } = await supabase.from("vehicles").select("*");
    if (!error) setVehicles((data || []).filter((v: any) => v.status === "available"));
  };

  const fetchDrivers = async () => {
    // Only fetch drivers who are currently available (not on a trip)
    const { data, error } = await supabase.from("drivers").select("*").eq("status", "available");
    if (!error) setDrivers(data || []);
  };

  const fetchAllDrivers = async () => {
    const { data, error } = await supabase.from('drivers').select('*');
    if (!error) setAllDrivers(data || []);
  };

  useEffect(() => {
    fetchTrips();
    fetchVehicles();
    fetchDrivers();
    fetchAllDrivers();
  }, []);

  const onSubmit = async (values: TripForm) => {
    setSubmitting(true);
    setError(null);
    // Ensure date is provided (trips.date is NOT NULL in DB)
    if (!values.date) {
      setError("Date is required.");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("trips").insert([{
      vehicle: values.vehicle,
      driver_id: values.driver_id ? Number(values.driver_id) : null,
      origin: values.origin,
      destination: values.destination,
      date: values.date instanceof Date ? values.date.toISOString().split("T")[0] : String(values.date),
      status: values.status,
    }]);
    setSubmitting(false);
    if (error) setError(error.message);
    else {
      setOpen(false);
      form.reset();
      // mark vehicle and driver as in-use
      try {
        if (values.driver_id) await supabase.from("drivers").update({ status: "in-use" }).eq("id", values.driver_id);
        if (values.vehicle) await supabase.from("vehicles").update({ status: "in-use" }).eq("plate", values.vehicle);
      } catch (e) {
        console.error("Failed to update status:", e);
      }
        fetchTrips();
        fetchDrivers();
        fetchVehicles();
        fetchAllDrivers();
    }
  };

  const getStatusBadge = (status: string) =>
    status === "active" ? <Badge className="bg-accent hover:bg-accent/90">Active</Badge>
    : <Badge className="bg-success hover:bg-success/90">Completed</Badge>;


  if (loading) {
    return <p>Loading trips...</p>;
  }

  const activeTrips = trips.filter(t => t.status === "active").length;
  const completedToday = trips.filter(t => t.status === "completed").length;
  const totalWeek = trips.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trip Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage vehicle assignments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Assign New Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign New Trip</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="vehicle" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <FormControl>
                      <select {...field} required className="input">
                        <option value="">Select a vehicle</option>
                        {vehicles.map((v: any) => (
                          <option key={v.id} value={v.plate}>{v.plate} - {v.make} {v.model}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="driver_id" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver</FormLabel>
                    <FormControl>
                      <select {...field} required className="input">
                        <option value="">Select a driver</option>
                        {drivers.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.license})</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="origin" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <FormControl>
                      <Input placeholder="Origin" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="destination" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="Destination" {...field} required />
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


                <FormField name="status" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select className="input" {...field} required>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Assigning..." : "Assign Trip"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Trips</CardTitle>
            <Clock className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrips}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Trips finished</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <MapPin className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Total trips</p>
          </CardContent>
        </Card>
      </div>

      {/* Trip Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map(trip => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.id}</TableCell>
                  <TableCell>{getDriverName(trip.driver_id)}</TableCell>
                  <TableCell className="font-mono text-sm">{trip.vehicle}</TableCell>
                  <TableCell>{trip.origin}</TableCell>
                  <TableCell>{trip.destination}</TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell className="text-right">
                    {trip.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          // Mark trip as completed
                          await supabase.from("trips").update({ status: "completed" }).eq("id", trip.id);
                          // Set driver status to available
                          if (trip.driver_id) {
                            await supabase.from("drivers").update({ status: "available" }).eq("id", trip.driver_id);
                          }
                          // Set vehicle status to available
                          if (trip.vehicle) {
                            await supabase.from("vehicles").update({ status: "available" }).eq("plate", trip.vehicle);
                          }
                          // Refresh lists so dropdowns update
                          fetchTrips();
                          fetchDrivers();
                          fetchVehicles();
                          fetchAllDrivers();
                        }}
                      >
                        Complete Trip
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

}
