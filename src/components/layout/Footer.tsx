import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900">CampusFix</span>
          <span>•</span>
          <span>Report It. Track It. Fix It.</span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <Link to="/about" className="hover:text-indigo-600 transition-colors">
            About CampusFix
          </Link>
          <Link to="/about" className="hover:text-indigo-600 transition-colors">
            Escalation Matrix
          </Link>
          <span className="flex items-center gap-1 text-slate-400">
            <Shield className="w-3.5 h-3.5" />
            Hackathon Production Edition
          </span>
        </div>
      </div>
    </footer>
  );
};
