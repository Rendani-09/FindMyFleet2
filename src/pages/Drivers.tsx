import { useEffect, useState } from "react";
import { Search, Plus, Eye, Phone, Mail } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

type DriverForm = {
  name: string;
  email: string;
  license: string;
  contact: string;
  status: string;
};

export default function Drivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const form = useForm<DriverForm>({
    defaultValues: {
      name: "",
      email: "",
      license: "",
      contact: "",
      status: "available",
    },
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("drivers").select("*");
    if (error) setError(error.message);
    else setDrivers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const onSubmit = async (values: DriverForm) => {
    setSubmitting(true);
    setError(null);
    // Normalize license (uppercase, remove non-alphanumerics)
    const licenseNorm = (values.license || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    // License must begin with 'SA' followed by 7 digits, e.g. SA1000005
    if (!/^SA\d{7}$/.test(licenseNorm)) {
      setError("License number must begin with 'SA' followed by 7 digits (e.g. SA1000005).");
      setSubmitting(false);
      return;
    }
    // Uniqueness check (use normalized value)
    const { data: existing, error: fetchError } = await supabase
      .from("drivers")
      .select("id")
      .eq("license", licenseNorm);
    if (fetchError) {
      setError("Could not validate license number uniqueness.");
      setSubmitting(false);
      return;
    }
    if (existing && existing.length > 0) {
      setError("License number already exists. It must be unique.");
      setSubmitting(false);
      return;
    }
    // Normalize and validate contact: only digits, exactly 10 digits required
    const contactDigits = (values.contact || "").replace(/\D/g, "");
    if (!/^\d{10}$/.test(contactDigits)) {
      setError("Contact number must be exactly 10 digits (numbers only).");
      setSubmitting(false);
      return;
    }
  const { error } = await supabase.from("drivers").insert([{ ...values, license: licenseNorm, contact: contactDigits }]);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setOpen(false);
      form.reset();
      fetchDrivers();
    }
  };

  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) =>
    status === "available" ? (
      <Badge className="bg-success hover:bg-success/90">Available</Badge>
    ) : (
      <Badge className="bg-accent hover:bg-accent/90">Assigned</Badge>
    );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (loading) return <p className="p-6">Loading drivers...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Driver Management</h1>
          <p className="text-muted-foreground mt-1">Manage your driver roster</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="license" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number</FormLabel>
                    <FormControl>
                    <Input
                      placeholder="License Number (e.g. SA1000005)"
                      {...field}
                      required
                      maxLength={9}
                      minLength={9}
                      pattern="SA\d{7}"
                      onChange={e => {
                        // Only allow alphanumeric, force uppercase
                        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        if (value.length > 9) value = value.slice(0, 9);
                        field.onChange(value);
                      }}
                      value={field.value}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="contact" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="10-digit contact number"
                        {...field}
                        required
                        maxLength={10}
                        pattern="\d{10}"
                        onChange={e => {
                          // allow only digits and limit to 10 chars
                          let v = String(e.target.value).replace(/\D/g, '');
                          if (v.length > 10) v = v.slice(0, 10);
                          field.onChange(v);
                        }}
                        value={field.value}
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
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Adding..." : "Add Driver"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or license number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Drivers ({filteredDrivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(driver.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {driver.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{driver.license}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {driver.contact}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (window.confirm(`Delete driver ${driver.name}? This cannot be undone.`)) {
                          await supabase.from("drivers").delete().eq("id", driver.id);
                          fetchDrivers();
                        }
                      }}
                    >
                      Delete
                    </Button>
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
