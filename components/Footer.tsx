import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-base font-semibold text-white tracking-wide">
              EkSetu — Government Interoperability Prototype
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              For demonstration purposes only. No real government or citizen data is accessed.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-navy-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EkSetu Prototype. Smart India Hackathon Demonstration.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>V1.0 Foundation Prototype</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
