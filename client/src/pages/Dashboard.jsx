import { ArrowUpRight, Briefcase, Building2, FileText, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { excelService } from '../services/excelService';
import { mouService } from '../services/mouService';
import { projectService } from '../services/projectService';
import { internService } from '../services/internService';

const stats = [
  { label: 'Total MOUs', value: '128', change: '+12%', icon: FileText, to: '/mous' },
  { label: 'Active Partners', value: '46', change: '+8%', icon: Building2, to: '/mous' },
  { label: 'Projects', value: '68', change: '+6%', icon: Briefcase, to: '/projects' },
];

const getMouStatus = (mou) => {
  const today = new Date();
  const end = mou?.valid_upto ? new Date(mou.valid_upto) : null;
  if (end && end < today) return 'expired';
  return 'active';
};

const formatDateLabel = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diffDays = Math.round((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [mous, setMous] = useState([]);
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [excelMessage, setExcelMessage] = useState('');
  const [excelError, setExcelError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    reportService.getReports().then(setMetrics).catch(() => {});
    Promise.all([
      mouService.getMous(),
      projectService.getProjects(),
      internService.getInterns(),
    ])
      .then(([mouRes, projectRes, internRes]) => {
        setMous(mouRes.mous || []);
        setProjects(projectRes.projects || []);
        setInterns(internRes.interns || []);
      })
      .catch(() => {
        setMous([]);
        setProjects([]);
        setInterns([]);
      });
  }, []);

  const statusData = useMemo(() => {
    const active = mous.filter((mou) => getMouStatus(mou) === 'active').length;
    const expired = mous.filter((mou) => getMouStatus(mou) === 'expired').length;
    const max = Math.max(active, expired, 1);
    return [
      { label: 'Active', count: active },
      { label: 'Expired', count: expired },
    ].map((item) => ({ ...item, percent: Math.max((item.count / max) * 100, item.count ? 10 : 0) }));
  }, [mous]);

  const recentActivity = useMemo(() => {
    const activity = [
      ...mous.map((mou) => ({
        title: 'MOU updated',
        detail: `${mou.college_name || 'Partner'} ${mou.mou_date ? `started ${mou.mou_date}` : 'record updated'}`,
        date: mou.updated_at || mou.created_at || mou.mou_date,
      })),
      ...projects.map((project) => ({
        title: 'Project added',
        detail: `${project.title || 'Project'} for MOU #${project.mou_id}`,
        date: project.updated_at || project.created_at || project.start_date,
      })),
      ...interns.map((intern) => ({
        title: 'Intern added',
        detail: `${intern.student_name || 'Student'} assigned to internship`,
        date: intern.updated_at || intern.created_at || intern.start_date,
      })),
    ].filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return activity;
  }, [mous, projects, interns]);

  const liveStats = metrics
    ? [
        { label: 'Total MOUs', value: metrics.totalMous, change: 'Recorded', icon: FileText, to: '/mous' },
        { label: 'Active Partners', value: metrics.activeMous, change: 'Current', icon: Building2, to: '/mous' },
        { label: 'Projects', value: metrics.projects, change: 'Recorded', icon: Briefcase, to: '/projects' },
      ]
    : stats;

  const handleFileSelected = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setExcelError('');
      setExcelMessage('');
      const response = await excelService.uploadExcel(formData);
      setExcelMessage(`Imported ${response.results.inserted} record(s); skipped ${response.results.skipped}.`);
      // refresh data shown on dashboard
      const [mouRes, projectRes, internRes] = await Promise.all([
        mouService.getMous(),
        projectService.getProjects(),
        internService.getInterns(),
      ]);
      setMous(mouRes.mous || []);
      setProjects(projectRes.projects || []);
      setInterns(internRes.interns || []);
      // refresh metrics
      try { const newMetrics = await reportService.getReports(); setMetrics(newMetrics); } catch (_) {}
      // clear input value so same file can be selected again if needed
      const input = document.getElementById('excel-dashboard-input'); if (input) input.value = '';
    } catch (e) {
      setExcelError(e.response?.data?.error || 'Excel upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Overview</p>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="flex items-center gap-2">
          <input id="excel-dashboard-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFileSelected(e.target.files?.[0])} />
          <button
            onClick={() => document.getElementById('excel-dashboard-input').click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload Excel'}
          </button>
        </div>
      </div>

      {excelMessage && <p className="text-sm text-green-700">{excelMessage}</p>}
      {excelError && <p className="text-sm text-red-700">{excelError}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {liveStats.map(({ label, value, change, icon: Icon, to }) => (
          <Link key={label} to={to} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">{value}</h2>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
              <ArrowUpRight size={16} /> {change}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">MOU Status Distribution</h3>
          <div className="mt-6 space-y-4">
            {statusData.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-blue-600"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <div className="mt-5 space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity found.</p>
            ) : (
              recentActivity.map((item, index) => (
                <div key={`${item.title}-${index}`} className="border-l-2 border-blue-500 pl-4">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.detail}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDateLabel(item.date)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
