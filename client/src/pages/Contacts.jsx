const contacts = [
  { name: 'Rahul Mehta', role: 'Partnership Manager', company: 'ABC Tech' },
  { name: 'Anita Nair', role: 'Coordinator', company: 'CloudNova' },
];

const ContactsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Network</p>
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {contacts.map((contact) => (
          <div key={contact.name} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-semibold text-gray-900">{contact.name}</p>
            <p className="mt-1 text-sm text-gray-600">{contact.role}</p>
            <p className="mt-2 text-sm text-blue-600">{contact.company}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactsPage;
