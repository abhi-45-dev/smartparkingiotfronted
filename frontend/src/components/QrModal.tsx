import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, url }) => {
  const [copied, setCopied] = React.useState(false);
  const activeUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-white tracking-tight mb-1">
          Scan for Live Phone Sync
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mb-6">
          Open your phone camera and scan to connect directly to the ESP32 real-time MQTT data stream.
        </p>

        {/* Large High-Contrast Scannable QR Code */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/40">
          <QRCodeSVG
            value={activeUrl}
            size={240}
            level="H"
            includeMargin={true}
            className="w-full max-w-[240px] h-auto"
          />
        </div>

        {/* URL Box */}
        <div className="mt-6 w-full">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="truncate pr-3">{activeUrl}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={activeUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
