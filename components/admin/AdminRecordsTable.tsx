'use client';

import React from 'react';
import { Archive, Download, Eye, Search, Trash2, X } from 'lucide-react';

export interface CombinedAdminRow {
  id: string;
  patientLabel: string;
  recordType: string;
  language: string;
  title: string;
  summary: string;
  urgencyLevel: string;
  archived: boolean;
  isSyntheticDemo: boolean;
  source: 'server' | 'firestore';
  createdAt: string;
}

export interface SelectedAdminRecord {
  title: string;
  subtitle: string;
  summary: string;
  urgency: string;
  language: string;
  isSynthetic: boolean;
  source: 'server' | 'firestore';
}

interface AdminRecordsTableProps {
  records: CombinedAdminRow[];
  search: string;
  typeFilter: string;
  onSearchChange: (val: string) => void;
  onTypeFilterChange: (val: string) => void;
  onSelectRecord: (rec: SelectedAdminRecord) => void;
  onExportRecord: (title: string, summary: string) => void;
  onArchiveServerRecord: (id: string) => void;
  onDeleteServerRecord: (id: string) => void;
  onDeleteFirestoreRecord: (id: string) => void;
}

export function AdminRecordsTable({
  records,
  search,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  onSelectRecord,
  onExportRecord,
  onArchiveServerRecord,
  onDeleteServerRecord,
  onDeleteFirestoreRecord,
}: AdminRecordsTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by patient reference, title, or summary..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter record type"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="all">All Types</option>
          <option value="chat">Medical Q&amp;A</option>
          <option value="medicine">Medicine Scan</option>
          <option value="injury">Injury Observation</option>
          <option value="triage">Guided Triage</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Patient / Record Label</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Urgency</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3.5">
                  <div className="font-bold text-slate-900">{row.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{row.patientLabel}</div>
                </td>
                <td className="px-4 py-3.5 font-mono text-[11px] uppercase text-slate-600">
                  {row.recordType}
                </td>
                <td className="px-4 py-3.5 font-mono text-[11px] font-bold uppercase text-slate-800">
                  {row.urgencyLevel}
                </td>
                <td className="px-4 py-3.5 text-[11px] text-slate-600">
                  {row.archived ? 'Archived' : 'Active'}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectRecord({
                          title: row.title,
                          subtitle: row.patientLabel,
                          summary: row.summary,
                          urgency: row.urgencyLevel,
                          language: row.language,
                          isSynthetic: row.isSyntheticDemo,
                          source: row.source,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportRecord(row.title, row.summary)}
                      aria-label="Export summary"
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    {row.source === 'server' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onArchiveServerRecord(row.id)}
                          aria-label="Archive or restore record"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteServerRecord(row.id)}
                          aria-label="Delete record"
                          className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {row.source === 'firestore' && (
                      <button
                        type="button"
                        onClick={() => onDeleteFirestoreRecord(row.id)}
                        aria-label="Delete Firestore record"
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RecordDetailModal({
  record,
  onClose,
}: {
  record: SelectedAdminRecord;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] font-bold text-teal-800 uppercase">
              {record.isSynthetic ? 'Synthetic Demo Preview Record' : 'Consented Patient Summary'}
            </div>
            <h2 className="mt-1 text-base font-extrabold text-slate-900">{record.title}</h2>
            <p className="text-xs text-slate-500">{record.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail drawer"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
          {record.summary}
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Privacy guarantee: Raw uploaded medicine or injury photographs, password hashes, and API
          credentials are never stored or visible in this portal.
        </p>
      </div>
    </div>
  );
}
