import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import { ShieldCheck, User, Clock, Activity } from 'lucide-react';

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
    <div className="w-full bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">Security Audit Logs</h3>
            <p className="text-xs text-stone-500">Immutable trace of sensitive store actions</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-stone-400">Loading security logs...</div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center bg-amber-50 rounded-xl border border-dashed border-amber-300">
          <p className="text-xs text-stone-500 font-medium">No audit logs recorded yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-amber-100 border border-amber-200 rounded-2xl overflow-hidden">
          {logs.map((log) => (
            <div key={log._id} className="p-3 bg-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md font-mono font-extrabold bg-violet-100 text-violet-800 text-[10px]">
                  {log.action}
                </span>
                <span className="font-bold text-stone-900">{log.entityType}</span>
              </div>

              <div className="flex items-center gap-3 text-stone-500">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  {log.actorId?.name || 'System'}
                </span>
                <span className="text-[10px] font-mono">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};