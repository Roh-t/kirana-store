import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import { ShieldCheck, User, Clock3, Activity } from 'lucide-react';

export const AuditLogViewer = ({ storeId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.getAuditLogs(storeId);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchLogs();
    }
  }, [storeId]);

  return (
    <div className="w-full rounded-[26px] border border-[#f4d58d] bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf1_100%)] p-4 shadow-[0_16px_38px_rgba(136,96,24,0.08)] ring-1 ring-[#f5e6be]">
      <div className="flex items-center justify-between gap-3 border-b border-[#f1dca0] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f2e8ff_0%,#e9d5ff_100%)] text-violet-700 shadow-inner shadow-violet-200/60">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-[-0.03em] text-stone-900">Security Audit Logs</h3>
            <p className="text-xs text-stone-500">Immutable trace of sensitive store actions</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#eedaa3] bg-[#fffaf0] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600">
          <Activity className="h-3.5 w-3.5 text-violet-600" />
          Live Monitor
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#f1dca0] bg-[#fffaf0] py-10 text-sm text-stone-500">
          Loading security logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#f1dca0] bg-[#fffaf0] py-10 text-center">
          <p className="text-sm font-medium text-stone-600">No audit logs recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const actorName = log.actorId?.name || 'System';
            const actorPhone = log.actorId?.phone;
            const actorEmail = log.actorId?.email;
            const actorDetails = [actorPhone, actorEmail].filter(Boolean);
            const actorLabel = actorDetails.length
              ? `${actorName} (${actorDetails.join(' • ')})`
              : actorName;
            const createdAt = new Date(log.createdAt);
            const timeText = createdAt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={log._id}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-[#f1dca0] bg-white/80 px-4 py-3.5 shadow-[0_8px_18px_rgba(120,98,30,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e7c977] hover:shadow-[0_12px_24px_rgba(120,98,30,0.08)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">
                    {log.action}
                  </span>
                  <span className="truncate text-base font-semibold tracking-[-0.03em] text-stone-800">
                    {log.entityType}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <div className="flex min-w-0 items-center gap-2 rounded-full bg-stone-50 px-2.5 py-1.5 ring-1 ring-stone-200/80">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-amber-100 text-violet-600">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <span className="max-w-[260px] truncate font-medium text-stone-700" title={actorLabel}>
                      {actorLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f3e4b2] bg-[#fffaf0] px-2 py-1 text-[10px] font-medium text-stone-500">
                    <Clock3 className="h-3 w-3 text-stone-400" />
                    {timeText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};