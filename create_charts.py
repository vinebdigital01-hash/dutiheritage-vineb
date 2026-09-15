import os
os.makedirs("src/components/admin/charts", exist_ok=True)

# index.ts to export all
index_ts = """export * from './RevenueChart';
export * from './OrdersChart';
export * from './TopProductsChart';
export * from './CollectionInsights';
export * from './ConversionFunnel';
export * from './PaymentSplit';
export * from './CustomerAcquisition';
"""
with open("src/components/admin/charts/index.ts", "w", encoding="utf-8") as f:
    f.write(index_ts)

revenue_chart = """import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RevenueChart = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
      <h3 className="text-[13px] font-bold tracking-[1px] uppercase text-neutral-500 mb-6">Revenue Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => val.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
"""
with open("src/components/admin/charts/RevenueChart.tsx", "w", encoding="utf-8") as f:
    f.write(revenue_chart)

orders_chart = """import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const OrdersChart = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
      <h3 className="text-[13px] font-bold tracking-[1px] uppercase text-neutral-500 mb-6">Orders Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => val.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{fill: '#f9fafb'}}
            />
            <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
"""
with open("src/components/admin/charts/OrdersChart.tsx", "w", encoding="utf-8") as f:
    f.write(orders_chart)

top_products_chart = """import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TopProductsChart = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
      <h3 className="text-[13px] font-bold tracking-[1px] uppercase text-neutral-500 mb-6">Top Selling Products</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
            <XAxis type="number" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{fontSize: 11}} width={120} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{fill: '#f9fafb'}}
              formatter={(value) => [value, 'Units Sold']}
            />
            <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
"""
with open("src/components/admin/charts/TopProductsChart.tsx", "w", encoding="utf-8") as f:
    f.write(top_products_chart)

collection_insights = """import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const CollectionInsights = ({ data, title }: { data: any[], title: string }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
      <h3 className="text-[13px] font-bold tracking-[1px] uppercase text-neutral-500 mb-2">{title}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey={data[0]?.views !== undefined ? "views" : "abandonments"}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'][index % 5]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
"""
with open("src/components/admin/charts/CollectionInsights.tsx", "w", encoding="utf-8") as f:
    f.write(collection_insights)

payment_split = """import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const PaymentSplit = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
      <h3 className="text-[13px] font-bold tracking-[1px] uppercase text-neutral-500 mb-2">Payment Methods</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={80}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
"""
with open("src/components/admin/charts/PaymentSplit.tsx", "w", encoding="utf-8") as f:
    f.write(payment_split)

customer_acquisition = """import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const CustomerAcquisition = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
      <h3 className="text-[13px] font-bold tracking-[1px] uppercase text-neutral-500 mb-6">Customer Acquisition</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => val.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="new" name="New Customers" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="returning" name="Returning" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
"""
with open("src/components/admin/charts/CustomerAcquisition.tsx", "w", encoding="utf-8") as f:
    f.write(customer_acquisition)

conversion_funnel = """import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ConversionFunnel = ({ data }: { data: any[] }) => {
  // Recharts doesn't have a native Funnel chart in the basic version, 
  // so we use a centered BarChart or sorted BarChart to simulate a funnel.
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
      <h3 className="text-[13px] font-bold tracking-[1px] uppercase text-neutral-500 mb-6">Conversion Funnel</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12}} width={80} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{fill: 'transparent'}}
            />
            <Bar dataKey="value" radius={4} barSize={32}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
"""
with open("src/components/admin/charts/ConversionFunnel.tsx", "w", encoding="utf-8") as f:
    f.write(conversion_funnel)

print("Created chart components")
