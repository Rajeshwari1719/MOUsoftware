const logs = [
  { action: 'Created MOU', user: 'Admin User', time: '2026-08-17 10:20' },
  { action: 'Updated Student Profile', user: 'Coordinator', time: '2026-08-17 09:05' },
];

const AuditLogsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Security</p>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={`${log.action}-${log.time}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <p className="font-medium text-gray-900">{log.action}</p>
                <p className="text-sm text-gray-500">By {log.user}</p>
              </div>
              <span className="text-sm text-gray-500">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
