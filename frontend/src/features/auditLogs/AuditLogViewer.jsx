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

  const groupedLogs = logs.reduce((acc, log) => {
    const actorId = log.actorId?._id || log.actorId || 'system';
    const actorName = log.actorId?.name || 'System';
    const actorPhone = log.actorId?.phone;
    const actorEmail = log.actorId?.email;
    const actorDetails = [actorPhone, actorEmail].filter(Boolean).join(' • ');

    if (!acc[actorId]) {
      acc[actorId] = {
        actorName,
        actorDetails,
        actions: []
      };
    }

    acc[actorId].actions.push(log);
    return acc;
  }, {});

  return (
    <div className="w-full rounded-[26px] border border-[#f4d58d] bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf1_100%)] p-3 sm:p-4 shadow-[0_16px_38px_rgba(136,96,24,0.08)] ring-1 ring-[#f5e6be]">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#f1dca0] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f2e8ff_0%,#e9d5ff_100%)] text-violet-700 shadow-inner shadow-violet-200/60 sm:h-11 sm:w-11">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-[-0.03em] text-stone-900 sm:text-xl">Security Audit Logs</h3>
            <p className="text-[11px] text-stone-500 sm:text-xs">Immutable trace of sensitive store actions</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-[#eedaa3] bg-[#fffaf0] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600 sm:flex">
          <Activity className="h-3.5 w-3.5 text-violet-600" />
          Live Monitor
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#f1dca0] bg-[#fffaf0] py-10 text-sm text-stone-500">
          Loading security logs...
        </div>
      ) : Object.keys(groupedLogs).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#f1dca0] bg-[#fffaf0] py-10 text-center">
          <p className="text-sm font-medium text-stone-600">No audit logs recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(groupedLogs).map((group) => (
            <div
              key={`${group.actorName}-${group.actorDetails || 'system'}`}
              className="overflow-hidden rounded-2xl border border-[#f1dca0] bg-white/90 shadow-[0_10px_20px_rgba(120,98,30,0.04)]"
            >
              <div className="flex flex-col gap-2 border-b border-[#f1dca0] bg-[linear-gradient(90deg,#fffaf0_0%,#ffffff_55%,#f5f0ff_100%)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 sm:h-9 sm:w-9">
                    <User className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-900 sm:text-[15px]">{group.actorName}</p>
                    <p className="truncate text-[10px] text-stone-500 sm:text-[11px]">
                      {group.actorDetails || 'System activity'}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                  {group.actions.length} logs
                </span>
              </div>

              <div className="divide-y divide-[#f1e4b6]">
                {group.actions.map((log) => {
                  const createdAt = new Date(log.createdAt);
                  const timeText = createdAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={log._id}
                      className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                    >
                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <span className="inline-flex shrink-0 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-violet-700 sm:text-[10px]">
                          {log.action}
                        </span>
                        <span className="truncate text-sm font-semibold tracking-[-0.02em] text-stone-800">
                          {log.entityType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f3e4b2] bg-[#fffaf0] px-2 py-1 text-[10px] font-medium text-stone-500">
                        <Clock3 className="h-3 w-3 text-stone-400" />
                        {timeText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};