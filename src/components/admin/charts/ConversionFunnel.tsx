"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
