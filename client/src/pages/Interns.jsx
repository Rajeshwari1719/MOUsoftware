import Button from '../components/Button';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { internService } from '../services/internService';
import { studentService } from '../services/studentService';
import { mouService } from '../services/mouService';

const columns = [
  { key: 'student_name', label: 'Student' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'end_date', label: 'End Date' },
  { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
];

const InternsPage = () => {
  const [interns, setInterns] = useState([]);
  const [students, setStudents] = useState([]);
  const [mous, setMous] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_id: '', mou_id: '', start_date: '', end_date: '', status: 'Active' });

  const load = async () => {
    const [internsRes, studentsRes, mousRes] = await Promise.all([
      internService.getInterns(),
      studentService.getStudents(),
      mouService.getMous(),
    ]);
    setInterns(internsRes.interns || []);
    setStudents(studentsRes.students || []);
    setMous(mousRes.mous || []);
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await internService.createIntern({
        student_id: form.student_id,
        mou_id: form.mou_id,
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
      });
      setOpen(false);
      setForm({ student_id: '', mou_id: '', start_date: '', end_date: '', status: 'Active' });
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Internship</p>
          <h1 className="text-3xl font-bold text-gray-900">Interns</h1>
        </div>
        <Button onClick={() => setOpen(true)}>Add Intern</Button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Table columns={columns} data={interns} />
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Intern">
        <form className="space-y-3" onSubmit={save}>
          <Select label="Student" required value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} options={students.map(s => ({ value: s.id, label: s.name }))} />
          <Select label="MOU" required value={form.mou_id} onChange={e => setForm({ ...form, mou_id: e.target.value })} options={mous.map(m => ({ value: m.id, label: `${m.college_name} (${m.mou_date})` }))} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End Date" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={[{ value: 'Active', label: 'Active' }, { value: 'Completed', label: 'Completed' }]} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Intern</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InternsPage;
