import React, { useState } from 'react';
import { X, QrCode, ScanLine, Copy, Check, ExternalLink, MapPin, Printer } from 'lucide-react';
import { LocationInfo } from '../../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation?: (location: LocationInfo) => void;
  defaultLocation?: LocationInfo;
}

const PRESET_QR_LOCATIONS: { name: string; tag: string; location: LocationInfo }[] = [
  {
    name: 'Hostel Block B - Room 304',
    tag: 'Boys Hostel',
    location: {
      campusArea: 'Hostel',
      building: 'Hostel Block B',
      floor: '3rd Floor',
      roomNumber: 'Room 304',
      specificSpot: 'Study Room Desk',
    },
  },
  {
    name: 'Aryabhata Academic Complex - Lab 2',
    tag: 'Academic Block',
    location: {
      campusArea: 'Academic Block',
      building: 'Aryabhata Academic Complex',
      floor: '1st Floor',
      roomNumber: 'Computer Lab 2',
      specificSpot: 'Row 3 West',
    },
  },
  {
    name: 'Girls Hostel 1 - 2nd Floor Washroom',
    tag: 'Girls Hostel',
    location: {
      campusArea: 'Hostel',
      building: 'Girls Hostel 1',
      floor: '2nd Floor',
      roomNumber: 'Common Washroom East',
      specificSpot: 'Under Sink #3',
    },
  },
  {
    name: 'Central Library - Reading Hall 1',
    tag: 'Library',
    location: {
      campusArea: 'Library',
      building: 'Central Knowledge Center',
      floor: 'Ground Floor',
      roomNumber: 'Main Reading Hall',
      specificSpot: 'Cubicle 14',
    },
  },
  {
    name: 'Ramanujan Science Block - Room 204',
    tag: 'Lecture Hall',
    location: {
      campusArea: 'Academic Block',
      building: 'Ramanujan Science Block',
      floor: '2nd Floor',
      roomNumber: 'Classroom 204',
      specificSpot: 'Lectern area',
    },
  },
];

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  defaultLocation,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('scan');
  const [locArea, setLocArea] = useState<LocationInfo['campusArea']>(defaultLocation?.campusArea || 'Hostel');
  const [building, setBuilding] = useState(defaultLocation?.building || 'Hostel Block B');
  const [floor, setFloor] = useState(defaultLocation?.floor || '3rd Floor');
  const [roomNumber, setRoomNumber] = useState(defaultLocation?.roomNumber || 'Room 304');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentPayload = JSON.stringify({
    campusArea: locArea,
    building,
    floor,
    roomNumber,
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/student/create?area=${encodeURIComponent(locArea)}&bld=${encodeURIComponent(building)}&fl=${encodeURIComponent(floor)}&rm=${encodeURIComponent(roomNumber)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Campus Location QR Code</h3>
              <p className="text-xs text-slate-500">Scan to report or generate classroom stickers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'scan' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            Scan / Pick Location
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'generate' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Generate Location QR
          </button>
        </div>

        {activeTab === 'scan' ? (
          <div className="mt-4 space-y-3">
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
              <ScanLine className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>QR Location Assistant:</strong> Select any physical campus location below to instantly simulate scanning its QR sticker and pre-populate your complaint ticket.
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {PRESET_QR_LOCATIONS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => {
                    if (onSelectLocation) {
                      onSelectLocation(preset.location);
                      onClose();
                    }
                  }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 text-slate-500 rounded-lg transition-colors">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-950">{preset.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {preset.location.building} • {preset.location.floor}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    Apply Location
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Area</label>
                <select
                  value={locArea}
                  onChange={(e) => setLocArea(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Hostel">Hostel</option>
                  <option value="Academic Block">Academic Block</option>
                  <option value="Lab Complex">Lab Complex</option>
                  <option value="Library">Library</option>
                  <option value="Cafeteria">Cafeteria</option>
                  <option value="Sports Complex">Sports Complex</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Building / Block</label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Floor</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room / Lab</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            {/* Visual QR Code Display */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 flex flex-col items-center">
                {/* SVG QR Code Simulation */}
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 100 100"
                  className="text-slate-900"
                  fill="currentColor"
                >
                  {/* Position detection patterns */}
                  <rect x="5" y="5" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="9" y="9" width="17" height="17" rx="1" fill="#ffffff" />
                  <rect x="13" y="13" width="9" height="9" fill="#0f172a" />

                  <rect x="70" y="5" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="74" y="9" width="17" height="17" rx="1" fill="#ffffff" />
                  <rect x="78" y="13" width="9" height="9" fill="#0f172a" />

                  <rect x="5" y="70" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="9" y="74" width="17" height="17" rx="1" fill="#ffffff" />
                  <rect x="13" y="78" width="9" height="9" fill="#0f172a" />

                  {/* QR Matrix Dots */}
                  <rect x="36" y="8" width="5" height="5" />
                  <rect x="46" y="8" width="5" height="5" />
                  <rect x="56" y="8" width="5" height="5" />
                  <rect x="36" y="18" width="5" height="5" />
                  <rect x="46" y="24" width="5" height="5" />
                  <rect x="56" y="18" width="5" height="5" />
                  <rect x="8" y="36" width="5" height="5" />
                  <rect x="18" y="36" width="5" height="5" />
                  <rect x="28" y="36" width="5" height="5" />
                  <rect x="38" y="38" width="7" height="7" fill="#4f46e5" />
                  <rect x="50" y="38" width="7" height="7" fill="#4f46e5" />
                  <rect x="65" y="36" width="5" height="5" />
                  <rect x="78" y="36" width="5" height="5" />
                  <rect x="88" y="36" width="5" height="5" />
                  <rect x="38" y="50" width="7" height="7" fill="#4f46e5" />
                  <rect x="50" y="50" width="7" height="7" fill="#4f46e5" />
                  <rect x="8" y="48" width="5" height="5" />
                  <rect x="22" y="52" width="5" height="5" />
                  <rect x="70" y="52" width="5" height="5" />
                  <rect x="85" y="52" width="5" height="5" />
                  <rect x="36" y="70" width="5" height="5" />
                  <rect x="48" y="75" width="5" height="5" />
                  <rect x="60" y="70" width="5" height="5" />
                  <rect x="75" y="72" width="5" height="5" />
                  <rect x="85" y="80" width="5" height="5" />
                  <rect x="42" y="88" width="5" height="5" />
                  <rect x="55" y="88" width="5" height="5" />
                  <rect x="70" y="88" width="5" height="5" />
                </svg>
                <p className="text-[11px] font-bold text-slate-800 mt-2">{building} • {roomNumber}</p>
                <p className="text-[9px] text-slate-500 font-mono tracking-wider">CAMPUSFIX LOCATION TAG</p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Link Copied!' : 'Copy Direct Link'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Label
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
