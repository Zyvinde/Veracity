'use client';

import React from 'react';
import { usePatientStore, UserRole } from '@/lib/store';
import { UserCheck, Stethoscope, ArrowLeftRight } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { userRole, setUserRole } = usePatientStore();

  const toggleRole = () => {
    setUserRole(userRole === 'coordinator' ? 'anesthesiologist' : 'coordinator');
  };

  return (
    <div className="flex items-center gap-1.5 rounded-[4px] border border-white/[0.12] bg-[#0A0B0E] p-0.5">
      <button
        type="button"
        onClick={() => setUserRole('coordinator')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-mono transition cursor-pointer ${
          userRole === 'coordinator'
            ? 'bg-white text-black font-bold shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.05]'
        }`}
      >
        <UserCheck className="h-3 w-3" />
        <span className="hidden sm:inline">Coordinator:</span>
        <span>Fatima, RN</span>
      </button>

      <button
        type="button"
        onClick={() => setUserRole('anesthesiologist')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-mono transition cursor-pointer ${
          userRole === 'anesthesiologist'
            ? 'bg-white text-black font-bold shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.05]'
        }`}
      >
        <Stethoscope className="h-3 w-3" />
        <span className="hidden sm:inline">Anesthesiologist:</span>
        <span>Dr. Tariq, MD</span>
      </button>

      <button
        type="button"
        onClick={toggleRole}
        title="Switch active demo persona"
        className="p-1 text-[#94A3B8] hover:text-white rounded-[3px] hover:bg-white/10 transition cursor-pointer"
      >
        <ArrowLeftRight className="h-3 w-3" />
      </button>
    </div>
  );
};

export default RoleSwitcher;
