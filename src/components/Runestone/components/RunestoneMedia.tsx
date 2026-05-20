import type { Runestone } from '../../../types';

interface RunestoneMediaProps {
  runestone: Runestone;
}

export const RunestoneMedia = ({ runestone }: RunestoneMediaProps) => {
  if (!runestone.direct_url) {
    return null;
  }

  return (
    <div>
      <div className="font-semibold text-gray-700 mb-2">Media</div>
      <div className="bg-gray-50 p-3 rounded">
        {runestone.link_url ? (
          <a
            href={runestone.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <img
              src={runestone.direct_url}
              className="w-full h-64 mb-2 object-contain"
              alt={`Runestone ${runestone.signature_text}`}
            />
          </a>
        ) : (
          <img
            src={runestone.direct_url}
            className="w-full h-64 mb-2 object-contain"
            alt={`Runestone ${runestone.signature_text}`}
          />
        )}
      </div>
    </div>
  );
};
