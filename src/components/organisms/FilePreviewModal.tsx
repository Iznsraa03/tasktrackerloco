'use client';

import React, { useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  fileUrl: string | null;
  fileName: string;
  onClose: () => void;
}

export function FilePreviewModal({ isOpen, fileUrl, fileName, onClose }: FilePreviewModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !fileUrl) return null;

  const ext = fileUrl.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPDF = ext === 'pdf';
  const isPreviewable = isImage || isPDF;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 overflow-hidden">
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 shrink-0">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-900 line-clamp-1">{fileName}</h3>
            <span className="text-xs text-slate-500 uppercase font-medium mt-0.5">{ext} File</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download={fileName}
              className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Unduh Berkas"
            >
              <Download size={20} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden flex items-center justify-center p-4">
          {isImage && (
            <img 
              src={fileUrl} 
              alt={fileName} 
              className="max-w-full max-h-full object-contain drop-shadow-md rounded-md"
            />
          )}
          
          {isPDF && (
            <iframe 
              src={fileUrl} 
              title={fileName}
              className="w-full h-full border-0 rounded-md shadow-sm bg-white"
            />
          )}

          {!isPreviewable && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200/60 max-w-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={32} className="text-slate-400" />
              </div>
              <h4 className="text-slate-900 font-bold mb-2">Pratinjau Tidak Tersedia</h4>
              <p className="text-sm text-slate-500 mb-6">
                Format berkas <strong className="uppercase">.{ext}</strong> tidak dapat ditampilkan langsung di dalam browser. Silakan unduh berkas untuk melihat isinya.
              </p>
              <a 
                href={fileUrl} 
                download={fileName}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#D2001A] text-white text-sm font-bold rounded-xl hover:bg-[#B00015] transition-colors"
              >
                <Download size={16} />
                Unduh Berkas Sekarang
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
