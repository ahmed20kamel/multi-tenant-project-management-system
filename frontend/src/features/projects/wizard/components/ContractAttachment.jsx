// مكون لإدارة مرفق واحد من مرفقات العقد
import { useTranslation } from "react-i18next";
import Field from "../../../../components/forms/Field";
import ViewRow from "../../../../components/forms/ViewRow";
import RtlSelect from "../../../../components/forms/RtlSelect";
import FileUpload from "../../../../components/file-upload/FileUpload";
import FileAttachmentView from "../../../../components/file-upload/FileAttachmentView";
import Button from "../../../../components/common/Button";
import { extractFileNameFromUrl } from "../../../../utils/fileHelpers";

const ATTACHMENT_TYPES = [
  { value: "main_contract", label: "عقد أصيل" },
  { value: "appendix", label: "ملحق عقد" },
  { value: "explanation", label: "توضيح تعاقدي" },
  { value: "bank_contract", label: "عقد بنك" },
];

export default function ContractAttachment({
  attachment,
  index, // ✅ للعرض فقط (appendixNumber)
  attachmentIndex, // ✅ الفهرس الفعلي في المصفوفة
  isView,
  onUpdate,
  onRemove,
  canRemove,
  projectId,
}) {
  const { t } = useTranslation();

  // ✅ استخدام attachmentIndex الفعلي، إذا لم يكن موجوداً نستخدم index (للتوافق مع الكود القديم)
  const actualIndex = attachmentIndex !== undefined ? attachmentIndex : index;

  // ✅ حساب التسمية بناءً على النوع وعدد الملاحق
  const getAttachmentTypeLabel = (type, appendixNum) => {
    if (type === "appendix") {
      return `ملحق عقد ${appendixNum + 1}`;
    }
    const typeOption = ATTACHMENT_TYPES.find((opt) => opt.value === type);
    return typeOption ? typeOption.label : type;
  };

  const attachmentTypeLabel = getAttachmentTypeLabel(attachment.type, index);

  if (isView) {
    return (
      <div style={{ 
        padding: "20px", 
        background: "var(--surface)", 
        borderRadius: "12px",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
          {/* نوع المرفق - صف كامل */}
          <ViewRow label="نوع المرفق" value={attachmentTypeLabel} />
          
          {/* التاريخ و الرفع - صف واحد بجانب بعض */}
          <div className="form-grid cols-2" style={{ gap: "16px" }}>
            <ViewRow label="تاريخ المرفق" value={attachment.date || ""} />
            {attachment.file_url && (
              <Field label="الملف">
                <FileAttachmentView
                  fileUrl={attachment.file_url}
                  fileName={attachment.file_name || extractFileNameFromUrl(attachment.file_url)}
                  projectId={projectId}
                  endpoint={`projects/${projectId}/contract/`}
                />
              </Field>
            )}
          </div>
          
          {/* الملاحظات - صف كامل */}
          {attachment.notes && (
            <ViewRow label="ملاحظات" value={attachment.notes} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "20px", 
      background: "var(--surface)", 
      borderRadius: "12px",
      border: "1px solid var(--border)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h5 style={{ margin: 0, color: "var(--text)", fontSize: "18px" }}>
          {attachment.type ? attachmentTypeLabel : "مرفق جديد"}
        </h5>
        {canRemove && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => onRemove(actualIndex)}
            style={{ padding: "8px 16px", fontSize: "14px" }}
          >
            حذف
          </Button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        {/* نوع المرفق - صف كامل */}
        <Field label="نوع المرفق">
          <RtlSelect
            className="rtl-select"
            options={ATTACHMENT_TYPES}
            value={attachment.type || ""}
            onChange={(v) => {
              onUpdate(actualIndex, "type", v);
            }}
            placeholder="اختر نوع المرفق"
          />
        </Field>

        {/* التاريخ و الرفع - صف واحد بجانب بعض */}
        <div className="form-grid cols-2" style={{ gap: "16px" }}>
          <Field label="تاريخ المرفق">
            <input
              className="input"
              type="date"
              value={attachment.date || ""}
              onChange={(e) => onUpdate(actualIndex, "date", e.target.value)}
            />
          </Field>
          <Field label="رفع الملف">
            <FileUpload
              value={attachment.file}
              onChange={(file) => onUpdate(actualIndex, "file", file)}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              maxSizeMB={10}
              showPreview={true}
              existingFileUrl={attachment.file_url}
              existingFileName={attachment.file_name || (attachment.file_url ? extractFileNameFromUrl(attachment.file_url) : "")}
              onRemoveExisting={() => onUpdate(actualIndex, "file", null)}
              compressionOptions={{
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
              }}
            />
          </Field>
        </div>

        {/* الملاحظات - صف كامل */}
        <Field label="ملاحظات (اختياري)">
          <textarea
            className="input"
            rows={3}
            value={attachment.notes || ""}
            onChange={(e) => onUpdate(actualIndex, "notes", e.target.value)}
            placeholder="أدخل الملاحظات (اختياري)..."
            style={{ resize: "vertical" }}
          />
        </Field>
      </div>
    </div>
  );
}

