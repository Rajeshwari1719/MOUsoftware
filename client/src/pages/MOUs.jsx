import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { mouService } from '../services/mouService';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Table from '../components/Table';

const getMouStatus = (mou) => {
  const today = new Date();
  const start = mou?.mou_date ? new Date(mou.mou_date) : null;
  const end = mou?.valid_upto ? new Date(mou.valid_upto) : null;

  if (end && end < today) return 'expired';
  if (start && start > today) return 'active';
  return 'active';
};

const columns = [
  { key: 'college_name', label: 'Partner' },
  { key: 'department_name', label: 'Department' },
  { key: 'mou_date', label: 'Start Date' },
  { key: 'valid_upto', label: 'Valid Until' },
  { key: 'national_or_international', label: 'Type' },
  { key: 'students_benefited', label: 'Students Benefited' },
  { key: 'contact_name', label: 'Contact Person' },
  { key: 'contact_email', label: 'Contact Email' },
  {
    key: 'status',
    label: 'Status',
    render: (_, row) => <StatusBadge status={getMouStatus(row)} />,
  },
];

const MOUsPage = () => {
  const navigate = useNavigate();
  const [mous, setMous] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { mouService.getMous().then((r) => setMous(r.mous || [])).catch((e) => setError(e.response?.data?.error || 'Could not load MOUs.')).finally(() => setLoading(false)); }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Management</p>
          <h1 className="text-3xl font-bold text-gray-900">MOUs</h1>
        </div>
        <Link to="/mous/new">
          <Button>Create MOU</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {error && <p className="p-3 text-red-700">{error}</p>}
        <Table columns={columns} data={mous} loading={loading} onRowClick={(mou) => navigate(`/mous/${mou.id}`)} />
      </div>
    </div>
  );
};

export default MOUsPage;
