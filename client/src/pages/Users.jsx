import Table from '../components/Table';

const users = [
  { id: 1, name: 'Admin User', email: 'admin@college.edu', role: 'admin' },
  { id: 2, name: 'Coordinator', email: 'coord@college.edu', role: 'coordinator' },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
];

const UsersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Administration</p>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Table columns={columns} data={users} />
      </div>
    </div>
  );
};

export default UsersPage;
