import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { mockBooks, isLoggedIn } from "@/lib/nostr";
import { AreaChart, BarChart, LineChart, PieChart } from "recharts";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, BookOpen, Clock, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
const mockReadingData = [{
  month: "Jan",
  books: 2,
  pages: 450
}, {
  month: "Feb",
  books: 1,
  pages: 320
}, {
  month: "Mar",
  books: 3,
  pages: 780
}, {
  month: "Apr",
  books: 2,
  pages: 520
}, {
  month: "May",
  books: 4,
  pages: 1100
}, {
  month: "Jun",
  books: 3,
  pages: 890
}, {
  month: "Jul",
  books: 1,
  pages: 400
}, {
  month: "Aug",
  books: 2,
  pages: 550
}, {
  month: "Sep",
  books: 3,
  pages: 720
}, {
  month: "Oct",
  books: 2,
  pages: 600
}, {
  month: "Nov",
  books: 1,
  pages: 350
}, {
  month: "Dec",
  books: 2,
  pages: 480
}];
const mockGenreData = [{
  name: "Fiction",
  value: 35
}, {
  name: "Fantasy",
  value: 25
}, {
  name: "Science Fiction",
  value: 15
}, {
  name: "Mystery",
  value: 10
}, {
  name: "Non-Fiction",
  value: 15
}];
const mockTimeData = [{
  time: "Morning",
  percent: 30
}, {
  time: "Afternoon",
  percent: 15
}, {
  time: "Evening",
  percent: 40
}, {
  time: "Night",
  percent: 15
}];
const Stats = () => {
  if (!isLoggedIn()) {
    return <Navigate to="/" />;
  }
  const [activeTab, setActiveTab] = useState("yearly");
  const [timeframe, setTimeframe] = useState("year");
  const [showPrototypeModal, setShowPrototypeModal] = useState(true);
  const totalBooks = 26;
  const totalPages = 7160;
  const avgPagesPerDay = 19;
  const longestStreak = 24;
  const currentStreak = 3;
  return <Layout>
      <Dialog open={showPrototypeModal} onOpenChange={setShowPrototypeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-bookverse-ink">Coming Soon!</DialogTitle>
            <DialogDescription className="pt-2">
              This Reading Stats page is currently a prototype. Real statistics based on your reading activity are coming soon! Feel free to explore this preview of what's to come.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowPrototypeModal(false)} className="bg-bookverse-accent hover:bg-bookverse-highlight">
              Continue Exploring
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-serif text-bookverse-ink mb-2">Reading Stats</h1>
            <p className="text-muted-foreground">
              Track your reading progress and discover insights about your reading habits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="rounded-full p-2 bg-bookverse-cream">
                    <BookOpen className="h-6 w-6 text-bookverse-accent" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Books Read</p>
                    <h3 className="text-2xl font-bold">{totalBooks}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="rounded-full p-2 bg-bookverse-cream">
                    <BarChartIcon className="h-6 w-6 text-bookverse-accent" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Pages Read</p>
                    <h3 className="text-2xl font-bold">{totalPages}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="rounded-full p-2 bg-bookverse-cream">
                    <Clock className="h-6 w-6 text-bookverse-accent" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Avg. Pages/Day</p>
                    <h3 className="text-2xl font-bold">{avgPagesPerDay}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="rounded-full p-2 bg-bookverse-cream">
                    <CalendarDays className="h-6 w-6 text-bookverse-accent" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <h3 className="text-2xl font-bold">{currentStreak} days</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reading History</CardTitle>
                <div className="flex space-x-2">
                  <Button variant={timeframe === "year" ? "default" : "outline"} size="sm" onClick={() => setTimeframe("year")} className={timeframe === "year" ? "bg-bookverse-accent hover:bg-bookverse-highlight" : ""}>
                    Year
                  </Button>
                  <Button variant={timeframe === "month" ? "default" : "outline"} size="sm" onClick={() => setTimeframe("month")} className={timeframe === "month" ? "bg-bookverse-accent hover:bg-bookverse-highlight" : ""}>
                    Month
                  </Button>
                  <Button variant={timeframe === "week" ? "default" : "outline"} size="sm" onClick={() => setTimeframe("week")} className={timeframe === "week" ? "bg-bookverse-accent hover:bg-bookverse-highlight" : ""}>
                    Week
                  </Button>
                </div>
              </div>
              <CardDescription>
                Track your reading volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <AreaChart data={mockReadingData} margin={{
                top: 20,
                right: 20,
                left: 20,
                bottom: 20
              }}>
                  <defs>
                    <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7F5E32" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7F5E32" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="books" stroke="#7F5E32" fillOpacity={1} fill="url(#colorBooks)" />
                </AreaChart>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Genre Distribution</CardTitle>
                <CardDescription>
                  What types of books you read most
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <PieChart width={400} height={300}>
                    <Pie data={mockGenreData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                      {mockGenreData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reading Time</CardTitle>
                <CardDescription>
                  When you read most during the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <BarChart data={mockTimeData} margin={{
                  top: 20,
                  right: 20,
                  left: 20,
                  bottom: 20
                }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="percent" name="Percentage" fill="#CF9E52" />
                  </BarChart>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>;
};
function Legend() {
  return null;
}
function Tooltip() {
  return null;
}
function XAxis({
  dataKey
}: {
  dataKey: string;
}) {
  return null;
}
function YAxis() {
  return null;
}
function CartesianGrid({
  strokeDasharray
}: {
  strokeDasharray: string;
}) {
  return null;
}
function Area({
  type,
  dataKey,
  stroke,
  fillOpacity,
  fill
}: {
  type: string;
  dataKey: string;
  stroke: string;
  fillOpacity: number;
  fill: string;
}) {
  return null;
}
function Pie({
  data,
  cx,
  cy,
  labelLine,
  outerRadius,
  fill,
  dataKey,
  nameKey,
  children
}: {
  data: any[];
  cx: string;
  cy: string;
  labelLine: boolean;
  outerRadius: number;
  fill: string;
  dataKey: string;
  nameKey: string;
  children: React.ReactNode;
}) {
  return null;
}
function Cell({
  fill
}: {
  fill: string;
}) {
  return null;
}
function Bar({
  dataKey,
  name,
  fill
}: {
  dataKey: string;
  name: string;
  fill: string;
}) {
  return null;
}
const COLORS = ['#7F5E32', '#CF9E52', '#1C2C3B', '#A67C52', '#D4B483'];
export default Stats;