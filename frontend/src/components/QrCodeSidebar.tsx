import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, ExternalLink, Maximize2 } from 'lucide-react';

interface QrCodeSidebarProps {
  onEnlarge: () => void;
}

export const QrCodeSidebar: React.FC<QrCodeSidebarProps> = ({ onEnlarge }) => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    const url = window.location.href;
    setCurrentUrl(url);
    setCustomUrl(url);
  }, []);

  const activeUrl = customUrl || currentUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl p-5 bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
      {/* Title & Enlarge Icon */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              Live Mobile Sync QR
            </h3>
          </div>
          <button
            onClick={onEnlarge}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Enlarge QR Code for room scanning"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Scan with your phone camera to view the live ESP32 parking stream in real time.
        </p>

        {/* QR Code Container with High-Contrast White Background */}
        <div className="flex justify-center p-3 bg-white rounded-xl shadow-lg border border-slate-200">
          {activeUrl ? (
            <QRCodeSVG
              value={activeUrl}
              size={150}
              level="M"
              includeMargin={false}
              className="w-full max-w-[150px] h-auto"
            />
          ) : (
            <div className="w-[150px] h-[150px] flex items-center justify-center text-slate-400 text-xs">
              Generating QR...
            </div>
          )}
        </div>

        {/* URL Display / Edit */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Encoded Public URL</span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-cyan-400 hover:underline"
            >
              {isEditing ? 'Done' : 'Override URL'}
            </button>
          </div>

          {isEditing ? (
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            />
          ) : (
            <div className="text-xs font-mono text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-slate-800 break-all select-all flex items-center justify-between">
              <span className="truncate pr-2">{activeUrl}</span>
              <a
                href={activeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
        <button
          onClick={onEnlarge}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-mono font-medium bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full QR</span>
        </button>
      </div>
    </div>
  );
};
