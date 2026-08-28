import React from "react";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SystemLog } from "@/models";
import { MarkFixedButton } from "./MarkFixedButton";
import { FiActivity, FiAlertTriangle, FiInfo, FiXCircle } from "react-icons/fi";

export const revalidate = 0; // Force dynamic for logs

export default function SystemLogsPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-wide uppercase">System Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Audit trailing for API errors, security warnings, and system events.</p>
        </div>
      </div>
      <LogViewer />
    </div>
  );
}

async function LogViewer() {
  // Requires SUPERADMIN normally, assuming layout handles base admin roles
  await connectDB();
  const rawLogs = await SystemLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
  
  // Safe serialization for Client boundary
  const logs = rawLogs.map(l => ({
    id: l._id.toString(),
    level: l.level,
    source: l.source,
    message: l.message,
    ip: l.ip || "N/A",
    path: l.path || "N/A",
    status: l.status || "open",
    createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
  }));

  if (logs.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
        <FiActivity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p>No system logs found yet. Everything is quiet.</p>
      </div>
    );
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error": return <FiXCircle className="w-5 h-5 text-red-500" />;
      case "warning": return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "info": default: return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error": return <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Error</span>;
      case "warning": return <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Warning</span>;
      case "info": default: return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Info</span>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider font-bold">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Path / IP</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">{getLevelIcon(log.level)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px]">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{getLevelBadge(log.level)}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-gray-500">{log.source}</td>
                <td className="px-4 py-3 text-gray-900 font-medium max-w-[300px] truncate" title={log.message}>{log.message}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                  <div className="flex flex-col gap-1">
                    <span className="truncate">{log.path}</span>
                    <span className="text-gray-400">{log.ip}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <MarkFixedButton logId={log.id} initialStatus={log.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
