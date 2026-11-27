import type { ReactNode } from 'react';
import type { Runestone } from '../../types';
import { RunestoneMedia } from './components/RunestoneMedia';

const headingClass = 'text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5';

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="text-xs text-gray-600 flex items-center justify-between">
    <span className="font-semibold">{label}:</span>
    <span className="text-gray-800 font-semibold">{value}</span>
  </div>
);

const FlagRow = ({ label, on, onClass }: { label: string; on: boolean; onClass: string }) => (
  <div className="flex items-center justify-between text-xs font-semibold">
    <span className="text-gray-600">{label}:</span>
    <span className={`px-2.5 py-0.5 rounded-full ${on ? onClass : 'bg-gray-100 text-gray-600'}`}>
      {on ? 'Yes' : 'No'}
    </span>
  </div>
);

const TEXTS = [
  {
    key: 'english_translation',
    label: 'English Translation',
    box: 'bg-primary/5 border-l-4 border-primary/50',
    text: 'text-gray-700 text-sm font-medium',
  },
  {
    key: 'swedish_translation',
    label: 'Swedish Translation',
    box: 'bg-accent/5 border-l-4 border-accent/50',
    text: 'text-gray-700 text-sm font-medium',
  },
  {
    key: 'norse_text',
    label: 'Norse Text',
    box: 'bg-gray-50/70 border border-gray-100',
    text: 'text-gray-750 text-sm italic font-semibold',
  },
  {
    key: 'transliteration',
    label: 'Transliteration',
    box: 'bg-gray-50/70 border border-gray-100',
    text: 'text-gray-700 text-xs font-mono tracking-wide',
  },
] as const;

interface RunestoneDetailsProps {
  runestone: Runestone;
  // Rendered between the media and the details grid (the detail page's visit status)
  children?: ReactNode;
}

// The body shared by the map modal and the runestone detail page.
export const RunestoneDetails = ({ runestone, children }: RunestoneDetailsProps) => (
  <div className="flex flex-col gap-6">
    <div>
      <h3 className={headingClass}>Location Details</h3>
      <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1.5">
        <span className="text-gray-800 font-semibold text-sm">{runestone.found_location}</span>
        <span className="text-xs text-gray-500 font-medium">{runestone.parish}</span>
        {!!runestone.district && (
          <span className="text-xs text-gray-500 font-medium">{runestone.district}</span>
        )}
        {!!runestone.municipality && (
          <span className="text-xs text-gray-500 font-medium">{runestone.municipality}</span>
        )}
        {!!runestone.current_location && (
          <span className="text-xs text-gray-600 font-semibold mt-1 bg-gray-100/60 px-2 py-1 rounded-md w-fit">
            Current: {runestone.current_location}
          </span>
        )}
        <span className="text-[10px] text-gray-400 font-mono mt-1">
          {runestone.latitude.toFixed(5)}, {runestone.longitude.toFixed(5)}
        </span>
      </div>
    </div>

    <RunestoneMedia runestone={runestone} />

    {children}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className={headingClass}>Details</h3>
        <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2 shadow-sm h-full">
          <DetailRow label="Material" value={runestone.material || 'Unknown'} />
          <DetailRow label="Dating" value={runestone.dating || 'Unknown'} />
          <DetailRow label="Type" value={runestone.rune_type || 'Unknown'} />
          <DetailRow label="Material type" value={runestone.material_type || 'Unknown'} />
          {!!runestone.carver && <DetailRow label="Carver" value={runestone.carver} />}
          {!!runestone.style && <DetailRow label="Style" value={runestone.style} />}
        </div>
      </div>

      <div>
        <h3 className={headingClass}>Status</h3>
        <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3 shadow-sm h-full justify-center">
          <FlagRow label="Lost" on={runestone.lost} onClass="bg-red-50 text-red-650" />
          <FlagRow
            label="Ornamental"
            on={runestone.ornamental}
            onClass="bg-indigo-50 text-indigo-650"
          />
          <FlagRow label="Recent" on={runestone.recent} onClass="bg-yellow-50 text-yellow-750" />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      {TEXTS.map(
        ({ key, label, box, text }) =>
          !!runestone[key] && (
            <div key={key}>
              <h3 className={headingClass}>{label}</h3>
              <div className={`p-4 rounded-2xl shadow-sm ${box}`}>
                <p className={`leading-relaxed m-0 ${text}`}>{runestone[key]}</p>
              </div>
            </div>
          ),
      )}
    </div>
  </div>
);
