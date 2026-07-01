import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  label: string;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(',');

function isAcceptedFile(file: File): boolean {
  const lowerCaseName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lowerCaseName.endsWith(extension));
}

export function FileUpload({ onFileSelect, label }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleSelectedFile = (file?: File) => {
    if (file && isAcceptedFile(file)) {
      onFileSelect(file);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleSelectedFile(event.dataTransfer.files?.[0]);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  };

  return (
    <div
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-emerald-300 bg-white hover:border-emerald-400'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        multiple={false}
        onChange={handleInputChange}
        className="hidden"
      />
      <Upload className="mx-auto h-12 w-12 text-emerald-500" />
      <p className="mt-2 text-sm text-slate-700">{label}</p>
      <p className="text-xs text-slate-500 mt-1">or click to browse</p>
    </div>
  );
}
