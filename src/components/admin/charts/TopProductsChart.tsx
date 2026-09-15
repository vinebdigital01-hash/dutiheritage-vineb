"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
