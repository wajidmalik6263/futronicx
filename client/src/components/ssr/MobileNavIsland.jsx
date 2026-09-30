'use client';

// Client island for the SSR header's mobile menu (the open/close drawer is
// stateful). The nav link list is passed from the server so the markup + theme
// stay identical to the SPA header.
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function MobileNavIsland({ navLinks }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="p-2 text-white hover:text-[#F5A623] cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 md:hidden bg-[#2A2116] border-t border-[#3d3320] px-4 pt-3 pb-6 space-y-3">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer text-white/90 hover:bg-[#3d3320] hover:text-white"
                onClick={() => setOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
