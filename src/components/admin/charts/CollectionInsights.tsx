"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
