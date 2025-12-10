// frontend/src/components/FileUpload.jsx
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFile, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { processFileForUpload, formatFileSize, validateFileSize } from '../../utils/fileCompression';
import Button from '../common/Button';
import { getStandardFileName } from '../../utils/fileNaming';
import './FileUpload.css';

/**
 * مكون محسّن لرفع الملفات مع:
 * - ضغط تلقائي للصور
 * - شريط تقدم
 * - معاينة الملف
 * - التحقق من الحجم والنوع
 * - تصميم محسّن بدون عرض اسم الملف
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
  fileType = "attachment", // نوع الملف لتحديد الاسم الموحد
  fileIndex = 0, // الفهرس للملفات المتعددة
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
      // في حال فشل المعالجة، نستخدم الملف الأصلي بدون إظهار خطأ أحمر
      onChange(file);
      setError('');
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

  const handleInputClick = () => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`file-upload-wrapper ${className}`}>
      {label && <label className="field-label">{label}</label>}
      
      {/* الملف الموجود سابقاً */}
      {existingFileUrl && !value && (
        <div className="existing-file-info">
          <div className="file-info-row">
            <div className="file-icon-text">
              <FaFile className="file-icon" />
              <span className="file-status-text">{t('current_file') || 'الملف الحالي'}</span>
            </div>
            <div className="file-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={handleInputClick}
                className="replace-file-btn"
                size="small"
                disabled={disabled || isProcessing}
              >
                {t('replace_file') || 'استبدال'}
              </Button>
              {onRemoveExisting && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleRemoveExisting}
                  className="remove-file-btn"
                  size="small"
                >
                  <FaTimes />
                </Button>
              )}
            </div>
          </div>
          {/* Input مخفي للاستبدال */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isProcessing}
            className="file-input-hidden"
          />
        </div>
      )}

      {/* الملف الجديد المختار */}
      {value instanceof File && (
        <div className="selected-file-info">
          <div className="file-info-row">
            <div className="file-icon-text">
              <FaCheckCircle className="file-icon file-icon-success" />
              <div className="file-status-group">
                <span className="file-status-text">{t('file_selected') || 'تم اختيار الملف'}</span>
                <span className="file-size">{formatFileSize(value.size)}</span>
              </div>
            </div>
            <div className="file-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={handleInputClick}
                className="replace-file-btn"
                size="small"
                disabled={disabled || isProcessing}
              >
                {t('replace_file') || 'استبدال'}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={handleRemove}
                className="remove-file-btn"
                disabled={isProcessing}
                size="small"
              >
                <FaTimes />
              </Button>
            </div>
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
          {/* Input مخفي للاستبدال */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isProcessing}
            className="file-input-hidden"
          />
        </div>
      )}

      {/* Input رفع الملف - يظهر فقط إذا لم يكن هناك ملف موجود أو جديد */}
      {!value && !existingFileUrl && (
        <div className="file-input-wrapper" onClick={handleInputClick}>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isProcessing}
            className="file-input-hidden"
          />
          <div className="file-input-display">
            <FaFile className="file-input-icon" />
            <span className="file-input-text">
              {isProcessing 
                ? (t('processing_file') || 'جاري معالجة الملف...')
                : (t('select_file') || 'اختر ملف')
              }
            </span>
            <span className="file-input-browse">{t('browse') || 'تصفح'}</span>
          </div>
        </div>
      )}

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
