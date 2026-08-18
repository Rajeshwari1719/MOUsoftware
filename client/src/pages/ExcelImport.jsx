import { useState } from 'react';
import Button from '../components/Button';
import { excelService } from '../services/excelService';

const ExcelImportPage = () => {
  const [file, setFile] = useState(null); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const importFile = async () => { if (!file) return; const data = new FormData(); data.append('file', file); setError(''); try { const response = await excelService.uploadExcel(data); setMessage(`Imported ${response.results.inserted} record(s); skipped ${response.results.skipped}.`); } catch (e) { setError(e.response?.data?.error || 'Import failed.'); } };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Import</p>
        <h1 className="text-3xl font-bold text-gray-900">Excel Import</h1>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-medium text-gray-700">Upload an Excel or CSV file</p>
        <p className="mt-2 text-sm text-gray-500">The file needs partner (or college name) and MOU date columns.</p>
        <input className="mx-auto mt-5 block" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files[0])} />
        <div className="mt-6 flex justify-center">
          <Button disabled={!file} onClick={importFile}>Import File</Button>
        </div>
        {message && <p className="mt-4 text-green-700">{message}</p>}{error && <p className="mt-4 text-red-700">{error}</p>}
      </div>
    </div>
  );
};

export default ExcelImportPage;
