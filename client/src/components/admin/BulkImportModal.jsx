import React, { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, Download, CheckCircle, AlertCircle, Loader2, FileText, Trash2 } from 'lucide-react';

/**
 * Parse a CSV string into an array of objects using the first row as headers.
 * Handles quoted fields containing commas.
 */
function parseCSV(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    if (lines.length < 2) return [];
    const headers = splitCSVRow(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const values = splitCSVRow(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
        return obj;
    });
}

function splitCSVRow(row) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; }
        else { cur += ch; }
    }
    result.push(cur);
    return result;
}

/**
 * Generate and trigger download of a CSV string.
 */
function downloadCSV(filename, rows) {
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

const PRODUCT_TEMPLATE_HEADERS = [
    'name', 'category_name', 'base_price', 'stock',
    'description', 'short_description',
    'origin', 'shelf_life', 'storage_instructions',
    'discount_percent', 'is_featured', 'is_new',
    'weight_options', 'image_url', 'gallery_images',
    'rating', 'review_count'
];
const PRODUCT_SAMPLE_ROW = [
    'Premium Organic Almonds', 'Nuts', '1500', '100',
    'High-quality organic almonds.', 'Fresh premium almonds',
    'Farm Direct', '12 months', 'Store in cool dry place',
    '0', '1', '0',
    '500g:1500,1kg:2800',
    'https://yourdomain.com/uploads/almonds.jpg',
    'https://yourdomain.com/uploads/almonds2.jpg|https://yourdomain.com/uploads/almonds3.jpg',
    '4.8', '0'
];

const CATEGORY_TEMPLATE_HEADERS = ['name', 'slug', 'image_url'];
const CATEGORY_SAMPLE_ROW = ['Nuts & Seeds', 'nuts-seeds', 'https://yourdomain.com/uploads/category.jpg'];

export default function BulkImportModal({ isOpen, onClose, mode, onImport }) {
    // mode: 'products' | 'categories'
    const [isDragging, setIsDragging] = useState(false);
    const [parsedRows, setParsedRows] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [fileName, setFileName] = useState('');
    const [importResult, setImportResult] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    const isProducts = mode === 'products';
    const templateHeaders = isProducts ? PRODUCT_TEMPLATE_HEADERS : CATEGORY_TEMPLATE_HEADERS;
    const sampleRow = isProducts ? PRODUCT_SAMPLE_ROW : CATEGORY_SAMPLE_ROW;

    const handleFile = useCallback((file) => {
        if (!file || !file.name.endsWith('.csv')) {
            alert('Please upload a .csv file.');
            return;
        }
        setFileName(file.name);
        setImportResult(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const rows = parseCSV(e.target.result);
            if (rows.length === 0) { alert('CSV is empty or has no data rows.'); return; }
            setHeaders(Object.keys(rows[0]));
            setParsedRows(rows);
        };
        reader.readAsText(file);
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleImport = async () => {
        if (parsedRows.length === 0) return;
        setIsImporting(true);
        setImportResult(null);
        try {
            const result = await onImport(parsedRows);
            setImportResult(result);
            setParsedRows([]);
            setFileName('');
        } catch (err) {
            setImportResult({ error: err?.response?.data?.error || err.message || 'Import failed' });
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setParsedRows([]); setHeaders([]); setFileName(''); setImportResult(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#FFFDF9] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-[#E8DEC8]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#E8DEC8] shrink-0">
                    <div>
                        <h2 className="text-lg font-extrabold font-heading text-[#3A2E1F]">
                            Bulk Import {isProducts ? 'Products' : 'Categories'}
                        </h2>
                        <p className="text-xs text-[#3A2E1F]/60 mt-0.5">
                            Upload a CSV file to import multiple {isProducts ? 'products' : 'categories'} at once
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-xl hover:bg-[#F5EFE0] text-[#3A2E1F]/60 hover:text-[#3A2E1F] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-5">

                    {/* Download Template */}
                    <div className="flex items-center justify-between p-4 bg-[#F5EFE0]/60 rounded-2xl border border-[#E8DEC8]">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[#D97706] shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-[#3A2E1F]">Download CSV Template</p>
                                <p className="text-[10px] text-[#3A2E1F]/60">Fill in the template and re-upload to import</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => downloadCSV(
                                isProducts ? 'products_template.csv' : 'categories_template.csv',
                                [templateHeaders, sampleRow]
                            )}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-bold text-xs rounded-full transition-colors shrink-0"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Template
                        </button>
                    </div>

                    {/* Drop Zone */}
                    {parsedRows.length === 0 && !importResult && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current.click()}
                            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all space-y-3 ${isDragging ? 'border-[#F5A623] bg-[#F5A623]/10' : 'border-[#E8DEC8] bg-[#F5EFE0]/20 hover:bg-[#F5EFE0]/40 hover:border-[#F5A623]/50'}`}
                        >
                            <input type="file" accept=".csv" ref={fileInputRef} className="hidden"
                                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />
                            <UploadCloud className="w-10 h-10 text-[#D97706] mx-auto" />
                            <div>
                                <p className="text-sm font-bold text-[#3A2E1F]">Drop your CSV file here or click to browse</p>
                                <p className="text-[11px] text-[#3A2E1F]/50 mt-0.5">Accepts .csv files only</p>
                            </div>
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedRows.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#D97706]" />
                                    <span className="text-xs font-bold text-[#3A2E1F]">{fileName}</span>
                                    <span className="text-[10px] font-bold bg-[#F5EFE0] text-[#D97706] px-2 py-0.5 rounded-full border border-[#E8DEC8]">
                                        {parsedRows.length} rows
                                    </span>
                                </div>
                                <button onClick={() => { setParsedRows([]); setHeaders([]); setFileName(''); }}
                                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Clear
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-[#E8DEC8] max-h-52">
                                <table className="w-full text-left text-xs border-collapse min-w-max">
                                    <thead className="bg-[#F5EFE0] sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 font-bold text-[#3A2E1F]/60 text-[10px] uppercase tracking-wider border-b border-[#E8DEC8]">#</th>
                                            {headers.map(h => (
                                                <th key={h} className="px-3 py-2 font-bold text-[#3A2E1F]/60 text-[10px] uppercase tracking-wider border-b border-[#E8DEC8] whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8DEC8]/50">
                                        {parsedRows.slice(0, 50).map((row, i) => (
                                            <tr key={i} className="hover:bg-[#F5EFE0]/30">
                                                <td className="px-3 py-1.5 text-[#3A2E1F]/40 font-mono">{i + 1}</td>
                                                {headers.map(h => (
                                                    <td key={h} className="px-3 py-1.5 text-[#3A2E1F] font-semibold whitespace-nowrap max-w-[160px] truncate">
                                                        {row[h] || <span className="text-[#3A2E1F]/30">—</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {parsedRows.length > 50 && (
                                <p className="text-[10px] text-[#3A2E1F]/50 text-center">
                                    Showing first 50 of {parsedRows.length} rows. All rows will be imported.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div className={`p-5 rounded-2xl border space-y-3 ${importResult.error ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                            {importResult.error ? (
                                <div className="flex items-center gap-2 text-rose-700">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-bold text-sm">{importResult.error}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <CheckCircle className="w-5 h-5 shrink-0" />
                                        <p className="font-bold text-sm">Import complete!</p>
                                    </div>
                                    <div className="flex gap-4 text-xs font-bold">
                                        <span className="text-emerald-700">✅ {importResult.imported} imported</span>
                                        {importResult.skipped > 0 && <span className="text-amber-700">⚠️ {importResult.skipped} skipped (duplicates)</span>}
                                        {importResult.errors?.length > 0 && <span className="text-rose-700">❌ {importResult.errors.length} errors</span>}
                                    </div>
                                    {importResult.errors?.length > 0 && (
                                        <ul className="text-[11px] text-rose-700 space-y-0.5 list-disc list-inside">
                                            {importResult.errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
                                            {importResult.errors.length > 8 && <li>...and {importResult.errors.length - 8} more</li>}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Column Reference */}
                    <details className="group">
                        <summary className="text-xs font-bold text-[#3A2E1F]/60 cursor-pointer hover:text-[#D97706] transition-colors select-none">
                            📋 Column reference & format guide
                        </summary>
                        <div className="mt-3 p-4 bg-[#F5EFE0]/50 rounded-2xl border border-[#E8DEC8] text-[11px] text-[#3A2E1F]/70 space-y-2">
                            {isProducts ? (
                                <ul className="space-y-1.5">
                                    <li><code className="font-mono bg-white px-1 rounded">name</code> — <strong>Required</strong>. Product name (auto-generates slug)</li>
                                    <li><code className="font-mono bg-white px-1 rounded">category_name</code> — Must match an existing category name exactly</li>
                                    <li><code className="font-mono bg-white px-1 rounded">base_price</code> — <strong>Required</strong>. Numeric price in PKR</li>
                                    <li><code className="font-mono bg-white px-1 rounded">stock</code> — Quantity available (default: 0)</li>
                                    <li><code className="font-mono bg-white px-1 rounded">image_url</code> — Full URL of the primary/cover image</li>
                                    <li><code className="font-mono bg-white px-1 rounded">gallery_images</code> — Pipe-separated extra image URLs: <code className="font-mono bg-white px-1 rounded">url1|url2|url3</code></li>
                                    <li><code className="font-mono bg-white px-1 rounded">weight_options</code> — Format: <code className="font-mono bg-white px-1 rounded">500g:800,1kg:1500</code></li>
                                    <li><code className="font-mono bg-white px-1 rounded">is_featured</code> / <code className="font-mono bg-white px-1 rounded">is_new</code> — 1 or 0</li>
                                    <li><code className="font-mono bg-white px-1 rounded">discount_percent</code> — 0–90</li>
                                    <li><code className="font-mono bg-white px-1 rounded">rating</code> — Initial rating 1.0–5.0 (default: 4.8)</li>
                                    <li><code className="font-mono bg-white px-1 rounded">review_count</code> — Initial review count (default: 0)</li>
                                    <li><code className="font-mono bg-white px-1 rounded">origin</code>, <code className="font-mono bg-white px-1 rounded">shelf_life</code>, <code className="font-mono bg-white px-1 rounded">storage_instructions</code>, <code className="font-mono bg-white px-1 rounded">short_description</code>, <code className="font-mono bg-white px-1 rounded">description</code> — Optional text</li>
                                    <li>Duplicate product names are <strong>skipped</strong> automatically.</li>
                                </ul>
                            ) : (
                                <ul className="space-y-1.5">
                                    <li><code className="font-mono bg-white px-1 rounded">name</code> — <strong>Required</strong>. Category display name</li>
                                    <li><code className="font-mono bg-white px-1 rounded">slug</code> — Optional. Auto-generated from name if omitted</li>
                                    <li><code className="font-mono bg-white px-1 rounded">image_url</code> — Optional. Full URL of the category image</li>
                                    <li>Duplicate slugs are <strong>skipped</strong> automatically.</li>
                                </ul>
                            )}
                        </div>
                    </details>

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-[#E8DEC8] flex gap-3 shrink-0">
                    <button onClick={handleClose}
                        className="w-1/2 py-3 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] font-bold text-xs rounded-full transition-colors">
                        {importResult?.imported > 0 ? 'Close' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={parsedRows.length === 0 || isImporting}
                        className="w-1/2 flex items-center justify-center gap-2 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] font-bold text-xs rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isImporting ? 'Importing...' : `Import ${parsedRows.length > 0 ? parsedRows.length + ' rows' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
