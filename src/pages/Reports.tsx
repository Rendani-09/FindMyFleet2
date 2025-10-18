import { Download, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/lib/supabase";

const monthlyTrendsData = [
  { month: "Jan", trips: 65, maintenance: 2800 },
  { month: "Feb", trips: 72, maintenance: 3200 },
  { month: "Mar", trips: 68, maintenance: 2500 },
  { month: "Apr", trips: 81, maintenance: 3800 },
  { month: "May", trips: 77, maintenance: 3100 },
  { month: "Jun", trips: 85, maintenance: 2900 },
];

const utilizationData = [
  { vehicle: "ABC-123", trips: 28, hours: 142 },
  { vehicle: "DEF-456", trips: 32, hours: 168 },
  { vehicle: "GHI-789", trips: 24, hours: 115 },
  { vehicle: "JKL-012", trips: 18, hours: 98 },
  { vehicle: "MNO-345", trips: 35, hours: 185 },
];

export default function Reports() {
  const [maintenanceTotal, setMaintenanceTotal] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      // Server-side aggregation for maintenance total
      const { data, error } = await supabase.from('maintenance').select('sum(cost)');
      if (error) {
        console.error('Failed to load maintenance total', error);
        return;
      }
      // data is an array like [{ sum: '12345.00' }]
      const total = (data && data[0] && data[0].sum) ? Number(String(data[0].sum)) : 0;
      setMaintenanceTotal(Number.isFinite(total) ? total : 0);
    };
    load().catch(console.error);
  }, []);

  // Helper to convert data to CSV
  function toCSV(rows: any[], columns: string[]) {
    const header = columns.join(",");
    const body = rows.map(row => columns.map(col => JSON.stringify(row[col] ?? "")).join(",")).join("\n");
    return header + "\n" + body;
  }

  // Export handler
  function handleExport() {
    // Example: export utilizationData as CSV
    const columns = ["vehicle", "trips", "hours"];
    const csv = toCSV(utilizationData, columns);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicle-utilization-report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Generate insights from fleet data</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button className="bg-accent hover:bg-accent/90" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
  <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trips
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">448</div>
            <p className="text-xs text-success mt-1">+12% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenance Costs
            </CardTitle>
            <DollarSign className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{maintenanceTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All maintenance total</p>
          </CardContent>
        </Card>

        {/* Fuel costs removed per request */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Utilization
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73%</div>
            <p className="text-xs text-success mt-1">+5% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="trips" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="maintenance" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                {/* fuel series removed */}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="vehicle" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }} 
                />
                <Legend />
                <Bar dataKey="trips" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="hours" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
