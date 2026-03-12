import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  label: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, label }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onFileSelect(files[0]),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-emerald-300 bg-white hover:border-emerald-400'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-emerald-500" />
      <p className="mt-2 text-sm text-slate-700">{label}</p>
      <p className="text-xs text-slate-500 mt-1">or click to browse</p>
    </div>
  );
};
