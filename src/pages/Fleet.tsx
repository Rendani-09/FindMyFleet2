import { useEffect, useState } from "react";
import { Search, Plus, Eye, Wrench, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

type VehicleForm = {
  plate: string;
  make: string;
  model: string;
  year: number;
  status: string;
  registration_date: Date | null;
};

export default function Fleet() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [lastDestinations, setLastDestinations] = useState<Record<string, string>>({});
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [nextServiceMap, setNextServiceMap] = useState<Record<string, { date: string; service?: string }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<VehicleForm>({
    defaultValues: {
      plate: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      status: "available",
      registration_date: null,
    },
  });

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vehicles").select("*");
    if (error) console.error(error);
    else setVehicles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchNextServices = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from('maintenance')
        .select('vehicle,date,service')
        .gte('date', today)
        .order('date', { ascending: true });
      if (error) {
        console.error('Failed to fetch next services', error);
        setNextServiceMap({});
        return;
      }
      const map: Record<string, { date: string; service?: string }> = {};
      for (const r of (data || [])) {
        if (!r || !r.vehicle || !r.date) continue;
        if (!map[r.vehicle] || r.date < map[r.vehicle].date) {
          map[r.vehicle] = { date: r.date, service: r.service };
        }
      }
      setNextServiceMap(map);
    } catch (err) {
      console.error('Error fetching next services', err);
      setNextServiceMap({});
    }
  };

  const fetchMaintenanceLogs = async (plate: string) => {
    const { data, error } = await supabase.from('maintenance').select('*').eq('vehicle', plate).order('date', { ascending: false });
    if (error) {
      console.error('Failed fetching maintenance logs', error);
      setMaintenanceLogs([]);
      return;
    }
    setMaintenanceLogs(data || []);
  };

  // Fetch recent trips to compute last destination per vehicle
  useEffect(() => {
    const fetchLastDestinations = async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("vehicle,destination,date")
        .order("date", { ascending: false });
      if (error) return console.error(error);
      const map: Record<string, string> = {};
      if (data) {
        for (const t of data) {
          if (!t || !t.vehicle) continue;
          if (!map[t.vehicle]) map[t.vehicle] = t.destination || "";
        }
      }
      setLastDestinations(map);
    };
    fetchLastDestinations();
  }, []);

  const onSubmit = async (values: VehicleForm) => {
    setSubmitting(true);
    setError(null);
    // Normalize plate and check client-side for duplicates (case-insensitive, ignore non-alphanumeric)
    const plateNormalized = values.plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
    try {
      const { data: platesData, error: platesErr } = await supabase.from("vehicles").select("plate");
      if (platesErr) throw platesErr;
      const exists = (platesData || []).some((r: any) => {
        const p = (r?.plate || "").toString();
        const normalizedExisting = p.toUpperCase().replace(/[^A-Z0-9]/g, "");
        return normalizedExisting === plateNormalized;
      });
      if (exists) {
        setError("Error: vehicle already exists");
        setSubmitting(false);
        return;
      }
    } catch (err: any) {
      // If the lookup fails for some reason, log and continue to allow server-side validation to catch duplicates
      console.error(err);
    }

    const { error } = await supabase.from("vehicles").insert([
      {
        ...values,
        plate: plateNormalized,
        registration_date: values.registration_date ? values.registration_date.toISOString().split("T")[0] : null,
      },
    ]);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setOpen(false);
      form.reset();
      fetchVehicles();
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available": return <Badge className="bg-success hover:bg-success/90">Available</Badge>;
      case "in-use": return <Badge className="bg-accent hover:bg-accent/90">In Use</Badge>;
      case "maintenance": return <Badge className="bg-warning hover:bg-warning/90">Maintenance</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <p>Loading vehicles...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">Manage your vehicle fleet</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="plate" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="License Plate"
                        {...field}
                        required
                        onChange={e => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="make" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="Make" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="model" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Model" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="year" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" min="1900" max={new Date().getFullYear()} {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="status" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select className="input" {...field} required>
                        <option value="available">Available</option>
                        <option value="in-use">In Use</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="registration_date" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Date</FormLabel>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="registration_date"
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
                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Adding..." : "Add Vehicle"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by license plate or model..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="in-use">In Use</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Plate</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map(vehicle => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>{lastDestinations[vehicle.plate] || vehicle.location || '-'}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        setSelectedVehicle(vehicle);
                        await fetchNextServices();
                        fetchMaintenanceLogs(vehicle.plate);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        fetchMaintenanceLogs(vehicle.plate);
                        setMaintOpen(true);
                      }}
                    >
                      <Wrench className="h-4 w-4" />
                    </Button>
                    {vehicle.status !== "maintenance" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { error } = await supabase.from("vehicles").update({ status: "maintenance" }).eq("id", vehicle.id);
                            if (error) throw error;
                            toast.success(`${vehicle.plate} set to maintenance`);
                            fetchVehicles();
                          } catch (err: any) {
                            console.error(err);
                            toast.error("Failed to set vehicle to maintenance");
                          }
                        }}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    )}
                    {vehicle.status === "maintenance" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { error } = await supabase.from("vehicles").update({ status: "available" }).eq("id", vehicle.id);
                            if (error) throw error;
                            toast.success(`${vehicle.plate} marked available`);
                            fetchVehicles();
                          } catch (err: any) {
                            console.error(err);
                            toast.error("Failed to update vehicle status");
                          }
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Vehicle Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-2">
              <div><b>License Plate:</b> {selectedVehicle.plate}</div>
              <div><b>Make:</b> {selectedVehicle.make}</div>
              <div><b>Model:</b> {selectedVehicle.model}</div>
              <div><b>Year:</b> {selectedVehicle.year}</div>
              <div><b>Status:</b> {getStatusBadge(selectedVehicle.status)}</div>
              <div><b>Location:</b> {selectedVehicle.location}</div>
              <div>
                <b>Next Service:</b>{' '}
                {(() => {
                  const ns = nextServiceMap[selectedVehicle.plate];
                  if (!ns) return '-';
                  return `${ns.date}${ns.service ? ` — ${ns.service}` : ''}`;
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Log Maintenance Dialog */}
      <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Maintenance</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-2">
              <div><b>Vehicle:</b> {selectedVehicle.plate} - {selectedVehicle.make} {selectedVehicle.model}</div>
              <div className="mt-2">
                <h3 className="font-medium">Recent Maintenance</h3>
                {maintenanceLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No maintenance records found for this vehicle.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Provider</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceLogs.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.date}</TableCell>
                          <TableCell>{m.service}</TableCell>
                          <TableCell className="font-semibold">{m.cost}</TableCell>
                          <TableCell>{m.provider}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
