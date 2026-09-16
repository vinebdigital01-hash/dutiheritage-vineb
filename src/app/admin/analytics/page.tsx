"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { PageHeader, StatCard, Badge, AdminButton, useToast } from "@/components/admin/ui";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { auth } from "@/lib/firebase";

type InsightsData = {
  overview: {
    totalRevenue: number, totalOrders: number, avgOrderValue: number,
    conversionRate: number, totalCustomers: number, newCustomers: number,
    returningCustomers: number, abandonedCarts: number, abandonedCartValue: number
  },
  productPerformance: Array<{
    productId: string, name: string, views: number, addToCarts: number,
    purchases: number, revenue: number, conversionRate: number, avgOrderValue: number
  }>,
  collectionPerformance: Array<{
    collectionId: string, name: string, views: number, revenue: number,
    orders: number, conversionRate: number, abandonedCarts: number
  }>,
  customerInsights: {
    topCustomers: Array<{ name: string, email: string, phone: string, city: string, totalSpent: number, totalOrders: number }>,
    cityDistribution: Array<{ city: string, count: number, revenue: number }>,
    stateDistribution: Array<{ state: string, count: number, revenue: number }>
  },
  timeInsights: {
    bestDayOfWeek: Array<{ day: string, orders: number, revenue: number }>,
    bestHourOfDay: Array<{ hour: number, orders: number }>,
    dailyTrends: Array<{ date: string, revenue: number, orders: number }>
  },
  paymentInsights: { cod: number, prepaid: number, partial: number },
  funnel: { productViews: number, addToCarts: number, checkoutStarts: number, purchases: number },
  adsRecommendations: Array<{ type: 'push' | 'cut' | 'retarget' | 'schedule' | 'geo', title: string, description: string, metric: string }>
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export default function AnalyticsInsightsPage() {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);
  const { show } = useToast();

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/analytics/insights?days=${days}`);
      setData(res as InsightsData);
    } catch (error: any) {
      show(error instanceof AdminApiError ? error.message : "Failed to load insights data", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async (endpoint: string, filename: string) => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      show(e.message, "error");
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8">
        <PageHeader title="Sales charts" subtitle="Loading charts…" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products" },
    { id: "customers", label: "Customers" },
    { id: "traffic", label: "Traffic & Funnel" },
    { id: "ads", label: "Ads Intelligence" }
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader title="Sales charts" subtitle="What sold and who bought — not for packing parcels" />
        <select 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="border rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
          <option value={365}>Last Year</option>
        </select>
      </div>

      <div className="flex space-x-2 border-b border-[var(--color-border)] pb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-black text-white" 
                : "bg-white text-gray-700 border border-[var(--color-border)] hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="text-center py-12 text-gray-500">No data available</div>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Revenue" value={`\u20B9${data.overview.totalRevenue.toLocaleString()}`} />
                <StatCard label="Total Orders" value={data.overview.totalOrders.toLocaleString()} />
                <StatCard label="Avg Order Value" value={`\u20B9${data.overview.avgOrderValue.toLocaleString()}`} />
                <StatCard label="Conversion Rate" value={`${data.overview.conversionRate.toFixed(2)}%`} />
                <StatCard label="Total Customers" value={data.overview.totalCustomers.toLocaleString()} />
                <StatCard label="New / Returning" value={`${data.overview.newCustomers} / ${data.overview.returningCustomers}`} />
                <StatCard label="Carts left unpaid" value={data.overview.abandonedCarts.toLocaleString()} />
                <StatCard label="Value of unpaid carts" value={`\u20B9${data.overview.abandonedCartValue.toLocaleString()}`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-4">Revenue Trend</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.timeInsights.dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" textAnchor="end" height={50} tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(val) => `\u20B9${val}`} width={80} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: any) => [`\u20B9${value}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-4">Orders Trend</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.timeInsights.dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" textAnchor="end" height={50} tick={{ fontSize: 12 }} />
                        <YAxis width={40} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm w-full md:w-1/2">
                <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-4">Payment Split</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'COD', value: data.paymentInsights.cod },
                          { name: 'Prepaid', value: data.paymentInsights.prepaid },
                          { name: 'Partial', value: data.paymentInsights.partial }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {['#f59e0b', '#10b981', '#3b82f6'].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-4">Top 10 Products by Revenue</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[...data.productPerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 10)} 
                      layout="vertical"
                      margin={{ left: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(val) => `\u20B9${val}`} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: any) => [`\u20B9${value}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--color-border)]">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium">Product Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-gray-50 border-b border-[var(--color-border)]">
                      <tr>
                        <th className="p-4 font-medium text-gray-600">Product</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Views</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Add to Cart</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Purchases</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Revenue</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {[...data.productPerformance].sort((a, b) => b.revenue - a.revenue).map((prod) => (
                        <tr key={prod.productId} className={`hover:bg-gray-50 ${prod.conversionRate > 5 ? 'bg-green-50/30' : prod.views > 100 && prod.purchases === 0 ? 'bg-red-50/30' : ''}`}>
                          <td className="p-4">{prod.name}</td>
                          <td className="p-4 text-right">{prod.views.toLocaleString()}</td>
                          <td className="p-4 text-right">{prod.addToCarts.toLocaleString()}</td>
                          <td className="p-4 text-right">{prod.purchases.toLocaleString()}</td>
                          <td className="p-4 text-right font-medium">\u20B9{prod.revenue.toLocaleString()}</td>
                          <td className="p-4 text-right">{prod.conversionRate.toFixed(2)}%</td>
                        </tr>
                      ))}
                      {data.productPerformance.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No product data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Customers" value={data.overview.totalCustomers.toLocaleString()} />
                <StatCard label="New Customers" value={data.overview.newCustomers.toLocaleString()} />
                <StatCard label="Returning Customers" value={data.overview.returningCustomers.toLocaleString()} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-4">City Distribution (Revenue)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[...data.customerInsights.cityDistribution].sort((a, b) => b.revenue - a.revenue).slice(0, 10)} 
                        layout="vertical"
                        margin={{ left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(val) => `\u20B9${val}`} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="city" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: any) => [`\u20B9${value}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#ec4899" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-4">State Distribution</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.customerInsights.stateDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="count"
                          nameKey="state"
                          label
                        >
                          {data.customerInsights.stateDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--color-border)]">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium">Top Customers by Spend</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-gray-50 border-b border-[var(--color-border)]">
                      <tr>
                        <th className="p-4 font-medium text-gray-600">Name</th>
                        <th className="p-4 font-medium text-gray-600">Email</th>
                        <th className="p-4 font-medium text-gray-600">Phone</th>
                        <th className="p-4 font-medium text-gray-600">City</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Orders</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {data.customerInsights.topCustomers.map((customer, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-4 font-medium">{customer.name}</td>
                          <td className="p-4 text-gray-500">{customer.email}</td>
                          <td className="p-4">{customer.phone}</td>
                          <td className="p-4">{customer.city}</td>
                          <td className="p-4 text-right">{customer.totalOrders}</td>
                          <td className="p-4 text-right font-medium text-green-600">\u20B9{customer.totalSpent.toLocaleString()}</td>
                        </tr>
                      ))}
                      {data.customerInsights.topCustomers.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No customer data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "traffic" && (
            <div className="space-y-6">
              <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-6">Conversion Funnel</h3>
                <div className="max-w-2xl mx-auto space-y-6">
                  {[
                    { label: 'Product Views', value: data.funnel.productViews, color: 'bg-blue-500' },
                    { label: 'Add to Carts', value: data.funnel.addToCarts, color: 'bg-indigo-500' },
                    { label: 'Checkout Starts', value: data.funnel.checkoutStarts, color: 'bg-purple-500' },
                    { label: 'Purchases', value: data.funnel.purchases, color: 'bg-green-500' }
                  ].map((step, i, arr) => {
                    const max = arr[0].value || 1;
                    const percentage = (step.value / max) * 100;
                    const stepPercentage = i > 0 && arr[i-1].value ? (step.value / arr[i-1].value) * 100 : 100;
                    
                    return (
                      <div key={step.label} className="relative">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{step.label}</span>
                          <span className="text-gray-500">
                            {step.value.toLocaleString()} 
                            {i > 0 && ` (${stepPercentage.toFixed(1)}% of prev)`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div 
                            className={`h-full ${step.color} rounded-full transition-all duration-1000`} 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-4">Best Day of Week</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.timeInsights.bestDayOfWeek}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `\u20B9${val}`} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue (\u20B9)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-4">Best Hour of Day</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.timeInsights.bestHourOfDay}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="hour" tickFormatter={(val) => `${val}:00`} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip labelFormatter={(label) => `${label}:00`} />
                        <Bar dataKey="orders" fill="#8b5cf6" name="Orders" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--color-border)]">
                  <h3 className="text-[13px] tracking-[2px] uppercase font-medium">Collection Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-gray-50 border-b border-[var(--color-border)]">
                      <tr>
                        <th className="p-4 font-medium text-gray-600">Collection</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Views</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Orders</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Revenue</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Conv. Rate</th>
                        <th className="p-4 font-medium text-gray-600 text-right">Carts left unpaid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {[...data.collectionPerformance].sort((a, b) => b.revenue - a.revenue).map((col) => (
                        <tr key={col.collectionId} className="hover:bg-gray-50">
                          <td className="p-4">{col.name}</td>
                          <td className="p-4 text-right">{col.views.toLocaleString()}</td>
                          <td className="p-4 text-right">{col.orders.toLocaleString()}</td>
                          <td className="p-4 text-right font-medium">\u20B9{col.revenue.toLocaleString()}</td>
                          <td className="p-4 text-right">{col.conversionRate.toFixed(2)}%</td>
                          <td className="p-4 text-right">{col.abandonedCarts.toLocaleString()}</td>
                        </tr>
                      ))}
                      {data.collectionPerformance.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No collection data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.adsRecommendations.map((rec, i) => {
                  let styles = "";
                  let icon = "";
                  switch(rec.type) {
                    case 'push': styles = "border-green-500 bg-green-50/10"; icon = "🚀"; break;
                    case 'cut': styles = "border-red-500 bg-red-50/10"; icon = "🛑"; break;
                    case 'retarget': styles = "border-amber-500 bg-amber-50/10"; icon = "🎯"; break;
                    case 'schedule': styles = "border-blue-500 bg-blue-50/10"; icon = "⏰"; break;
                    case 'geo': styles = "border-purple-500 bg-purple-50/10"; icon = "📍"; break;
                  }
                  
                  return (
                    <div key={i} className={`bg-white border-2 rounded-xl p-6 shadow-sm ${styles}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{icon}</span>
                        <h4 className="font-semibold">{rec.title}</h4>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{rec.description}</p>
                      <div className="bg-white/60 p-3 rounded-lg border border-white inline-block">
                        <span className="text-sm font-medium">{rec.metric}</span>
                      </div>
                    </div>
                  );
                })}
                {data.adsRecommendations.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-white border border-[var(--color-border)] rounded-xl">
                    No active ads recommendations at the moment. Check back later!
                  </div>
                )}
              </div>

              <div className="bg-white border border-[var(--color-border)] rounded-xl p-8 shadow-sm">
                <h3 className="text-[13px] tracking-[2px] uppercase font-medium mb-6">Export Data</h3>
                <div className="flex flex-wrap gap-4">
                  <AdminButton onClick={() => downloadCsv(`/api/analytics/export-insights?days=${days}`, `product_insights_${days}d.csv`)}>
                    Export Product Insights CSV
                  </AdminButton>
                  <AdminButton onClick={() => downloadCsv(`/api/analytics/export-audience?days=${days}`, `meta_ads_audience_${days}d.csv`)} variant="secondary">
                    Export Audience for Meta Ads
                  </AdminButton>
                  <AdminButton onClick={() => downloadCsv(`/api/analytics/export-insights?days=${days}`, `full_report_${days}d.csv`)} variant="secondary">
                    Export Full Report
                  </AdminButton>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
