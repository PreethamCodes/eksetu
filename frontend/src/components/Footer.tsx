import React from 'react';
import { Shield, Layers, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-base mb-1">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>EkSetu — Government Interoperability Platform</span>
            </div>
            <p className="text-slate-400 text-xs max-w-xl">
              "Share Proof, Not Databases." Architectural platform demonstrating secure, federated attribute verification across departmental registries.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-slate-300 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Federated Data Providers</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Minimization Layer</span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2 text-center sm:text-left">
          <p>
            Demonstration Environment. Verified across simulated departmental registries.
          </p>
          <p className="mt-1 sm:mt-0 font-medium">
            EkSetu National Interoperability Framework
          </p>
        </div>
      </div>
    </footer>
  );
};
