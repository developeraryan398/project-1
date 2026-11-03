import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Wrench,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowLeft,
  X,
  Zap,
  Droplets,
  Wind,
  Wifi,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusDB } from '../../services/store';
import { ComplaintCategory, ComplaintPriority, LocationInfo } from '../../types';
import { getAutoRoutedDepartment, calculateDueDate } from '../../services/autoAssign';
import { ImageUploadModal } from '../../components/common/ImageUploadModal';
import { QrCodeModal } from '../../components/common/QrCodeModal';

const CATEGORIES: { label: ComplaintCategory; icon: React.ReactNode; desc: string }[] = [
  { label: 'Electricity', icon: <Zap className="w-4 h-4 text-amber-500" />, desc: 'Fans, lights, switches, sparks' },
  { label: 'Plumbing', icon: <Droplets className="w-4 h-4 text-blue-500" />, desc: 'Taps, flushes, drainage' },
  { label: 'Water Leakage', icon: <Droplets className="w-4 h-4 text-cyan-500" />, desc: 'Ceiling drip, pipe bursts' },
  { label: 'Washroom Cleaning', icon: <Sparkles className="w-4 h-4 text-emerald-500" />, desc: 'Sanitization, trash bins' },
  { label: 'Room Cleaning', icon: <Sparkles className="w-4 h-4 text-teal-500" />, desc: 'Classroom & corridor cleaning' },
  { label: 'AC and Cooling', icon: <Wind className="w-4 h-4 text-sky-500" />, desc: 'Cooling, leaks, filters' },
  { label: 'Furniture and Broken Benches', icon: <Wrench className="w-4 h-4 text-orange-500" />, desc: 'Broken desks, chairs, doors' },
  { label: 'Internet and Wi-Fi', icon: <Wifi className="w-4 h-4 text-indigo-500" />, desc: 'Router drop, slow speed' },
  { label: 'Hostel Maintenance', icon: <Building className="w-4 h-4 text-purple-500" />, desc: 'Locks, cupboards, curtains' },
  { label: 'Other Issues', icon: <AlertCircle className="w-4 h-4 text-slate-500" />, desc: 'General campus maintenance' },
];

export const CreateComplaint: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const [category, setCategory] = useState<ComplaintCategory>('Electricity');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');

  // Sanitization helper for location fields from QR or URL query parameters
  const sanitizeLocationParam = (val: string | null, fallback: string, maxLen = 100): string => {
    if (!val) return fallback;
    const clean = val.replace(/[<>{}[\]\\]/g, '').trim().slice(0, maxLen);
    return clean || fallback;
  };

  const validAreas: LocationInfo['campusArea'][] = [
    'Hostel',
    'Academic Block',
    'Lab Complex',
    'Library',
    'Cafeteria',
    'Sports Complex',
    'Other',
  ];
  const rawArea = searchParams.get('area');
  const safeArea: LocationInfo['campusArea'] = validAreas.includes(rawArea as any)
    ? (rawArea as LocationInfo['campusArea'])
    : 'Hostel';

  const defaultBuilding = currentUser?.hostelInfo ? currentUser.hostelInfo.split(',')[0].trim() : 'Hostel Block B';
  const defaultRoom = currentUser?.hostelInfo ? currentUser.hostelInfo.split(',')[1]?.trim() || 'Room 304' : 'Room 304';

  // Location State with QR input sanitization
  const [campusArea, setCampusArea] = useState<LocationInfo['campusArea']>(safeArea);
  const [building, setBuilding] = useState(() => sanitizeLocationParam(searchParams.get('bld'), defaultBuilding));
  const [floor, setFloor] = useState(() => sanitizeLocationParam(searchParams.get('fl'), '3rd Floor', 40));
  const [roomNumber, setRoomNumber] = useState(() => sanitizeLocationParam(searchParams.get('rm'), defaultRoom, 40));
  const [specificSpot, setSpecificSpot] = useState('');

  // Images State
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto routing preview
  const autoDept = getAutoRoutedDepartment(category);
  const slaDeadline = calculateDueDate(priority, autoDept.departmentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser) {
      setFormError('Authentication required. Please sign in to submit a complaint.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setFormError('Please provide a complaint title and a detailed description.');
      return;
    }

    setSubmitting(true);
    try {
      const created = CampusDB.createComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location: {
          campusArea,
          building: building.trim(),
          floor: floor.trim(),
          roomNumber: roomNumber.trim(),
          specificSpot: specificSpot.trim() || undefined,
        },
        studentId: currentUser.uid,
        studentName: currentUser.name || 'Campus Student',
        studentEmail: currentUser.email || 'student@campusfix.edu',
        studentPhone: currentUser.phone,
        imageUrls,
      });

      // Redirect to detailed tracking view
      navigate(`/student/complaints/${created.complaintId}`);
    } catch (err) {
      setFormError('Failed to submit complaint. Please check input data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"
        >
          <QrCode className="w-3.5 h-3.5" />
          Scan Classroom/Hostel QR
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Report Campus Issue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fill in the details below. Our automated dispatch system routes tickets instantly to the relevant technician crew.
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Problem Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {cat.icon}
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{cat.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Auto Assignment Badge */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Automatic Department Assignment:</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                → {autoDept.departmentName}
              </span>
            </div>
          </div>

          {/* Location details */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Problem Location *
              </label>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <QrCode className="w-3 h-3" />
                Pick from Campus QR list
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Area</label>
                <select
                  value={campusArea}
                  onChange={(e) => setCampusArea(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Hostel">Hostel Block</option>
                  <option value="Academic Block">Academic Block / Classrooms</option>
                  <option value="Lab Complex">Laboratory Complex</option>
                  <option value="Library">Central Library</option>
                  <option value="Cafeteria">Cafeteria / Dining Hall</option>
                  <option value="Sports Complex">Sports Complex</option>
                  <option value="Other">Other Campus Spot</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g. Hostel Block B"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Floor *</label>
                <input
                  type="text"
                  required
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. Ground Floor, 2nd Floor"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Room / Classroom / Lab *</label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 304, Lab 2, Hall A"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Location Spot (Optional)
              </label>
              <input
                type="text"
                value={specificSpot}
                onChange={(e) => setSpecificSpot(e.target.value)}
                placeholder="e.g. Above study desk 2, Near left window, Basin #3"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Priority selection & SLA preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Issue Severity &amp; Priority *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['Low', 'Medium', 'High', 'Urgent'] as ComplaintPriority[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? p === 'Urgent'
                          ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-300'
                          : p === 'High'
                          ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                          : p === 'Medium'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-300'
                          : 'border-slate-800 bg-slate-100 text-slate-900 ring-2 ring-slate-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">{p}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {p === 'Urgent' ? 'Critical / Life Safety' : p === 'High' ? 'High Impact' : p === 'Medium' ? 'Standard Repair' : 'Minor Cosmetic'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Target Resolution SLA Deadline:
              </span>
              <span className="font-bold text-slate-800 font-mono">
                {new Date(slaDeadline).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              4. Complaint Title &amp; Description *
            </label>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary (e.g. Ceiling Fan Regulator Sparking Violently)"
                className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />

              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide exact symptoms, when it started, safety risks, or specific equipment IDs..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Attach Photos (Proof of Issue)
              </label>
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                {imageUrls.length > 0 ? 'Edit / Add More Photos' : '+ Upload Photos'}
              </button>
            </div>

            {imageUrls.length === 0 ? (
              <div
                onClick={() => setShowImageModal(true)}
                className="p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all cursor-pointer text-center group"
              >
                <Camera className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-1.5 transition-colors" />
                <p className="text-xs font-bold text-slate-700">Click to upload or choose demo sample photos</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Photos help technicians bring exact spare parts</p>
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto py-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 group shadow-xs">
                    <img src={url} alt="Attached" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/student"
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              {submitting ? 'Routing Ticket...' : 'Submit & Generate Ticket ID'}
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImagesSelected={(urls) => setImageUrls((prev) => [...prev, ...urls])}
        title="Upload Issue Photos"
      />

      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onSelectLocation={(loc) => {
          setCampusArea(loc.campusArea);
          setBuilding(loc.building);
          setFloor(loc.floor);
          setRoomNumber(loc.roomNumber);
          if (loc.specificSpot) setSpecificSpot(loc.specificSpot);
        }}
      />
    </div>
  );
};
