import React, { useState } from 'react'
import { Upload, FileSpreadsheet, Download, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { downloadStudentCSVTemplate, parseStudentCSV } from '../utils/csvExporter'

export default function CSVImportModal({ classes = [], onImportSuccess, onClose }) {
  const [csvText, setCsvText] = useState('')
  const [parsedStudents, setParsedStudents] = useState([])
  const [error, setError] = useState('')

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        if (typeof text === 'string') {
          setCsvText(text)
          const students = parseStudentCSV(text, classes)
          setParsedStudents(students)
          setError('')
        }
      } catch (err) {
        setError(err.message || 'Failed to parse CSV file.')
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (parsedStudents.length === 0) return
    onImportSuccess(parsedStudents)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Bulk Enroll Students via CSV</h3>
            <p className="text-xs text-slate-400">Upload a spreadsheet of student names, classes, and departments</p>
          </div>
        </div>

        {/* Step 1: Download Template */}
        <div className="mb-5 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Need the correct column format?</p>
            <p className="text-[11px] text-slate-400">Download our sample template with pre-filled columns</p>
          </div>
          <button
            type="button"
            onClick={downloadStudentCSVTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-sky-400 hover:text-sky-300 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Box */}
        <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors mb-5 bg-slate-800/30">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-300 mb-1">Select your completed CSV file</p>
          <p className="text-[11px] text-slate-500 mb-3">Accepts .csv format</p>
          <label className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-600/20 transition-all">
            Choose CSV File
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Preview of Parsed Students */}
        {parsedStudents.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready to import {parsedStudents.length} students</span>
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-slate-700 rounded-xl divide-y divide-slate-800 text-xs">
              {parsedStudents.slice(0, 10).map((st, i) => (
                <div key={i} className="p-2 flex items-center justify-between bg-slate-800/40">
                  <span className="font-medium text-white">{st.name}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{st.reg_no}</span>
                    <span className="text-sky-400">({st.department})</span>
                  </div>
                </div>
              ))}
              {parsedStudents.length > 10 && (
                <div className="p-2 text-center text-slate-500 italic bg-slate-800/60 text-[11px]">
                  + {parsedStudents.length - 10} more students
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedStudents.length === 0}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all"
          >
            Import {parsedStudents.length > 0 ? `(${parsedStudents.length}) Students` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
