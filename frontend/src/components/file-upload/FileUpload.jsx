// frontend/src/components/FileUpload.jsx
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { processFileForUpload, formatFileSize, validateFileSize } from '../../utils/fileCompression';
import Button from '../common/Button';
import './FileUpload.css';

/**
 * مكون محسّن لرفع الملفات مع:
 * - ضغط تلقائي للصور
 * - شريط تقدم
 * - معاينة الملف
 * - التحقق من الحجم والنوع
 */
export default function FileUpload({
  value, // File أو null
  onChange, // (file: File | null) => void
  onProgress, // (progress: number) => void (اختياري)
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxSizeMB = 10,
  label,
  disabled = false,
  showPreview = true,
  compressionOptions = {},
  existingFileUrl,
  existingFileName,
  onRemoveExisting,
  className = "",
}) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsProcessing(true);

    try {
      // التحقق من الحجم
      if (!validateFileSize(file, maxSizeMB)) {
        setError(t('file_too_large') || `الملف كبير جداً. الحد الأقصى: ${maxSizeMB}MB`);
        e.target.value = '';
        setIsProcessing(false);
        return;
      }

      // معالجة الملف (ضغط الصور)
      const processedFile = await processFileForUpload(file, compressionOptions);
      
      onChange(processedFile);
      setError('');
    } catch (err) {
      console.error('خطأ في معالجة الملف:', err);
      setError(t('file_processing_error') || 'حدث خطأ في معالجة الملف');
    } finally {
      setIsProcessing(false);
      // إعادة تعيين input للسماح باختيار نفس الملف مرة أخرى
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExisting = () => {
    if (onRemoveExisting) {
      onRemoveExisting();
    }
  };

  return (
    <div className={`file-upload-wrapper ${className}`}>
      {label && <label className="field-label">{label}</label>}
      
      {/* الملف الموجود سابقاً */}
      {existingFileUrl && !value && (
        <div className="existing-file-info">
          <div className="file-info">
            <span className="file-name">
              {t('current_file') || 'الملف الحالي'}: {existingFileName || 'ملف'}
            </span>
            {onRemoveExisting && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleRemoveExisting}
                className="remove-file-btn"
              >
                {t('remove') || 'إزالة'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* الملف الجديد المختار */}
      {value instanceof File && (
        <div className="selected-file-info">
          <div className="file-info">
            <div className="file-details">
              <span className="file-name">
                {t('file_selected') || 'الملف المختار'}: {value.name}
              </span>
              <span className="file-size">{formatFileSize(value.size)}</span>
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={handleRemove}
              className="remove-file-btn"
              disabled={isProcessing}
            >
              {t('remove') || 'إزالة'}
            </Button>
          </div>
          {showPreview && value.type.startsWith('image/') && (
            <div className="file-preview">
              <img 
                src={URL.createObjectURL(value)} 
                alt="Preview" 
                className="preview-image"
              />
            </div>
          )}
        </div>
      )}

      {/* Input رفع الملف */}
      <div className="file-input-wrapper">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || isProcessing}
          className="file-input"
        />
        {isProcessing && (
          <div className="processing-indicator">
            <span>{t('processing_file') || 'جاري معالجة الملف...'}</span>
          </div>
        )}
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="file-error">
          {error}
        </div>
      )}

      {/* معلومات إضافية */}
      <div className="file-upload-hint">
        {t('max_file_size') || `الحد الأقصى للحجم: ${maxSizeMB}MB`}
      </div>
    </div>
  );
}

