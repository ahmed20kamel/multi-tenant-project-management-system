import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import Dialog from "../../../components/Dialog";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import Field from "../../../components/fields/Field";
import ViewRow from "../../../components/fields/ViewRow";
import ConsultantFeesSection from "../components/ConsultantFeesSection";
import YesNoChips from "../../../components/YesNoChips";
import RtlSelect from "../../../components/fields/RtlSelect";
import InfoTip from "../components/InfoTip";
import NumberField from "../../../components/fields/NumberField";
import Button from "../../../components/Button";
import FileAttachmentView from "../../../components/FileAttachmentView";
import FileUpload from "../../../components/FileUpload";
import ContractAttachment from "../components/ContractAttachment";
import PersonField from "../components/PersonField";
import useContract from "../../../hooks/useContract";
import { formatMoney, formatMoneyArabic, toIsoDate, getDayName } from "../../../utils/formatters";
import { numberToArabicWords } from "../../../utils/numberFormatting";
import { num, toBool, formatServerErrors, flattenEntries, labelForKey, PRIMARY_ORDER } from "../../../utils/helpers";
import { getErrorMessage } from "../../../utils/errorHandler";
import { extractFileNameFromUrl } from "../../../utils/fileHelpers";
import { formatUAEPhone } from "../../../utils/inputFormatters";

export default function ContractStep({ projectId, onPrev, onNext, isView: isViewProp }) {
  const { t, i18n: i18next } = useTranslation();
  const isAR = i18next.language === "ar";
  const navigate = useNavigate();
  const { form, setF, existingId, setExistingId, isView: isViewState, setIsView } = useContract(projectId);
  // ✅ توحيد السلوك: إذا كان isViewProp محدد من الخارج (من WizardPage)، نستخدمه مباشرة
  // الوضع الافتراضي هو التعديل (false) وليس الفيو
  const [viewMode, setViewMode] = useState(() => {
    // إذا كان isViewProp محدد صراحة (true أو false)، نستخدمه
    if (isViewProp !== undefined) return isViewProp === true;
    // إذا لم يكن محدد، نستخدم isViewState من الـ hook
    return isViewState === true;
  });
  const hasNextStep = typeof onNext === "function";
  
  // ✅ مزامنة مع isViewProp من الخارج
  useEffect(() => {
    if (isViewProp !== undefined) {
      setViewMode(isViewProp === true);
    } else {
      // إذا لم يكن محدد من الخارج، نستخدم isViewState من الـ hook
      setViewMode(isViewState === true);
    }
  }, [isViewProp, isViewState]);

  const updateViewMode = (next) => {
    setViewMode(next);
    // ✅ تحديث isViewState في الـ hook فقط إذا لم يكن isViewProp محدد من الخارج
    if (isViewProp === undefined) {
      setIsView(next);
    }
  };
  const [errorMsg, setErrorMsg] = useState("");
  const [startOrderFileUrl, setStartOrderFileUrl] = useState("");
  const [startOrderFileName, setStartOrderFileName] = useState(""); // اسم الملف المحفوظ محلياً
  const [contractFileUrl, setContractFileUrl] = useState("");
  const [contractFileName, setContractFileName] = useState("");
  const [contractAppendixFileUrl, setContractAppendixFileUrl] = useState("");
  const [contractAppendixFileName, setContractAppendixFileName] = useState("");
  const [contractExplanationFileUrl, setContractExplanationFileUrl] = useState("");
  const [contractExplanationFileName, setContractExplanationFileName] = useState("");

  // قوائم ثابتة
  const CONTRACT_CLASSIFICATION = useMemo(
    () => [
      {
        value: "housing_loan_program",
        label: t("contract.classification.housing_loan_program.label"),
        desc: t("contract.classification.housing_loan_program.desc"),
      },
      {
        value: "private_funding",
        label: t("contract.classification.private_funding.label"),
        desc: t("contract.classification.private_funding.desc"),
      },
    ],
    [t]
  );

  const CONTRACT_TYPES = useMemo(
    () => [
      { value: "lump_sum", label: t("contract.types.lump_sum") },
      { value: "percentage", label: t("contract.types.percentage") },
      { value: "design_build", label: t("contract.types.design_build") },
      { value: "re_measurement", label: t("contract.types.re_measurement") },
    ],
    [t]
  );

  // حساب تاريخ نهاية المشروع (يشمل التمديدات)
  useEffect(() => {
    if (!form.start_order_date || !form.project_duration_months) return;
    try {
      const d = new Date(form.start_order_date);
      let months = Number(form.project_duration_months);
      let days = 0;
      
      if (isNaN(months) || months < 0) return;
      
      // ✅ إضافة التمديدات
      if (Array.isArray(form.extensions) && form.extensions.length > 0) {
        form.extensions.forEach((ext) => {
          if (ext.months) {
            months += Number(ext.months) || 0;
          }
          if (ext.days) {
            days += Number(ext.days) || 0;
          }
        });
      }
      
      // ✅ إضافة الشهور
      d.setMonth(d.getMonth() + months);
      // ✅ إضافة الأيام
      if (days > 0) {
        d.setDate(d.getDate() + days);
      }
      
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const end = `${yyyy}-${mm}-${dd}`;
      if (end !== form.project_end_date) {
        setF("project_end_date", end);
      }
    } catch {}
  }, [form.start_order_date, form.project_duration_months, form.extensions, setF]);

  // حساب تمويل المالك تلقائيًا
  useEffect(() => {
    const total = num(form.total_project_value, 0);
    const bank = num(form.total_bank_value, 0);
    const owner = Math.max(0, total - bank);
    const currentOwner = num(form.total_owner_value, 0);
    // تحديث فقط إذا كان هناك فرق كبير (أكثر من 0.01 لتجنب مشاكل الفاصلة العشرية)
    if (Math.abs(owner - currentOwner) > 0.01) {
      setF("total_owner_value", String(owner));
    }
  }, [form.total_project_value, form.total_bank_value, setF]);

  // تحميل URLs الملفات والمرفقات
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/contract/`);
        if (Array.isArray(data) && data.length > 0) {
          const contractData = data[0];
          if (contractData.start_order_file) {
            setStartOrderFileUrl(contractData.start_order_file);
            setStartOrderFileName(extractFileNameFromUrl(contractData.start_order_file));
          }
          
          // ✅ تحميل المرفقات الديناميكية
          if (contractData.attachments && Array.isArray(contractData.attachments) && contractData.attachments.length > 0) {
            const loadedAttachments = contractData.attachments.map(att => ({
              type: att.type || "main_contract",
              date: att.date || "",
              notes: att.notes || "",
              file: null, // لا نحمل File object
              file_url: att.file_url || null,
              file_name: att.file_name || (att.file_url ? extractFileNameFromUrl(att.file_url) : null),
            }));
            setF("attachments", loadedAttachments);
          } else if (!form.attachments || form.attachments.length === 0) {
            // ✅ إذا لم تكن هناك مرفقات، نتحقق من الملفات القديمة للتوافق
            const oldAttachments = [];
            if (contractData.contract_file) {
              oldAttachments.push({
                type: "main_contract",
                date: contractData.contract_date || "",
                notes: "",
                file: null,
                file_url: contractData.contract_file,
                file_name: extractFileNameFromUrl(contractData.contract_file),
              });
            }
            if (contractData.contract_appendix_file) {
              oldAttachments.push({
                type: "appendix",
                date: contractData.contract_date || "",
                notes: "",
                file: null,
                file_url: contractData.contract_appendix_file,
                file_name: extractFileNameFromUrl(contractData.contract_appendix_file),
              });
            }
            if (contractData.contract_explanation_file) {
              oldAttachments.push({
                type: "explanation",
                date: contractData.contract_date || "",
                notes: "",
                file: null,
                file_url: contractData.contract_explanation_file,
                file_name: extractFileNameFromUrl(contractData.contract_explanation_file),
              });
            }
            if (oldAttachments.length > 0) {
              setF("attachments", oldAttachments);
            }
          }
          
          // الملفات القديمة (للتوافق)
          if (contractData.contract_file) {
            setContractFileUrl(contractData.contract_file);
            setContractFileName(extractFileNameFromUrl(contractData.contract_file));
          }
          if (contractData.contract_appendix_file) {
            setContractAppendixFileUrl(contractData.contract_appendix_file);
            setContractAppendixFileName(extractFileNameFromUrl(contractData.contract_appendix_file));
          }
          if (contractData.contract_explanation_file) {
            setContractExplanationFileUrl(contractData.contract_explanation_file);
            setContractExplanationFileName(extractFileNameFromUrl(contractData.contract_explanation_file));
          }
        }
      } catch (e) {}
    })();
  }, [projectId, setF]);

  // بناء الحمولة والحفظ
  const buildPayload = () => {
    if (!form.contract_classification) throw new Error(t("contract.errors.select_classification"));
    if (!form.contract_type) throw new Error(t("contract.errors.select_type"));
    if (!form.contract_date) throw new Error(t("contract.errors.select_date"));

    const total = num(form.total_project_value, NaN);
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error(t("contract.errors.total_project_value_positive"));
    }

    const isHousing = form.contract_classification === "housing_loan_program";
    const bank = num(form.total_bank_value, isHousing ? NaN : 0);
    const owner = Math.max(0, total - bank);

    if (isHousing) {
      if (!Number.isFinite(bank) || bank < 0) {
        throw new Error(t("contract.errors.bank_value_nonnegative"));
      }
      // التحقق من أن قيمة المالك محسوبة بشكل صحيح (مع هامش خطأ صغير)
      const currentOwner = num(form.total_owner_value, NaN);
      if (Math.abs(currentOwner - owner) > 0.01) {
        throw new Error(t("contract.errors.owner_value_autocalc"));
      }
    }

    // التحقق من أمر المباشرة إذا كان موجود
    if (form.has_start_order === "yes") {
      if (!form.start_order_file && !startOrderFileUrl) {
        throw new Error(t("start_order_required"));
      }
      if (!form.start_order_date) {
        throw new Error(t("contract.errors.select_date") || "Start order date is required");
      }
    }

    const jsonPayload = {
      contract_classification: form.contract_classification,
      contract_type: form.contract_type,
      tender_no: form.tender_no || "",
      contract_date: toIsoDate(form.contract_date),
      owners: form.owners || [],
      contractor_name: form.contractor_name || "",
      contractor_name_en: form.contractor_name_en || "",
      contractor_trade_license: form.contractor_trade_license || "",
      contractor_phone: form.contractor_phone || "",
      contractor_email: form.contractor_email || "",
      total_project_value: total,
      total_bank_value: isHousing ? bank : 0,
      total_owner_value: isHousing ? owner : total,
      project_duration_months: num(form.project_duration_months, 0),
      owner_includes_consultant: toBool(form.owner_includes_consultant),
      owner_fee_design_percent: num(form.owner_fee_design_percent, 0),
      owner_fee_supervision_percent: num(form.owner_fee_supervision_percent, 0),
      owner_fee_extra_mode: form.owner_fee_extra_mode || "percent",
      owner_fee_extra_value: num(form.owner_fee_extra_value, 0),
      bank_includes_consultant: toBool(form.bank_includes_consultant),
      bank_fee_design_percent: num(form.bank_fee_design_percent, 0),
      bank_fee_supervision_percent: num(form.bank_fee_supervision_percent, 0),
      bank_fee_extra_mode: form.bank_fee_extra_mode || "percent",
      bank_fee_extra_value: num(form.bank_fee_extra_value, 0),
      start_order_exists: toBool(form.has_start_order),
      start_order_date: form.start_order_date || null,
      project_end_date: form.project_end_date || null,
      general_notes: form.general_notes || "",
    };

    // ✅ تنظيف التمديدات قبل الإرسال
    const cleanExtensions = (form.extensions || [])
      .filter(ext => {
        // ✅ إزالة التمديدات الفارغة تماماً
        if (!ext || (typeof ext !== "object")) return false;
        // ✅ إزالة التمديدات التي لا تحتوي على أي بيانات
        const hasReason = ext.reason && String(ext.reason).trim() !== "";
        const hasDays = ext.days !== undefined && ext.days !== null && Number(ext.days) > 0;
        const hasMonths = ext.months !== undefined && ext.months !== null && Number(ext.months) > 0;
        return hasReason || hasDays || hasMonths;
      })
      .map(ext => ({
        reason: String(ext.reason || "").trim(),
        days: Number(ext.days) || 0,
        months: Number(ext.months) || 0,
      }));

    // ✅ دائماً نستخدم FormData (حتى لو لم يكن هناك ملفات) لضمان إرسال owners بشكل صحيح
    const fd = new FormData();
    
    // إضافة الحقول النصية
    Object.entries(jsonPayload).forEach(([k, v]) => {
      // تخطي الملفات - سنضيفها لاحقاً
      if (k === "start_order_file" || k === "contract_file" || 
          k === "contract_appendix_file" || k === "contract_explanation_file") {
        return;
      }
      // ✅ معالجة owners بشكل خاص - إرسالها كـ JSON string
      if (k === "owners") {
        if (Array.isArray(v) && v.length > 0) {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, "[]"); // قائمة فارغة
        }
        return;
      }
      if (v === null || v === undefined || v === "") return;
      if (typeof v === "object" && !(v instanceof File) && !(v instanceof Blob) && !Array.isArray(v)) {
        fd.append(k, JSON.stringify(v));
      } else if (Array.isArray(v)) {
        fd.append(k, JSON.stringify(v));
      } else {
        fd.append(k, v);
      }
    });
    
    // ✅ إضافة التمديدات بعد التنظيف
    fd.append("extensions", JSON.stringify(cleanExtensions));
    
    // ✅ إضافة المرفقات الديناميكية (مع التنظيف)
    if (form.attachments && Array.isArray(form.attachments) && form.attachments.length > 0) {
      // ✅ تنظيف المرفقات - إزالة المرفقات الفارغة
      const validAttachments = form.attachments.filter((att, idx) => {
        if (!att || typeof att !== "object") return false;
        // ✅ مرفق صالح إذا كان له نوع أو ملف أو ملاحظات
        const hasType = att.type && String(att.type).trim() !== "";
        const hasFile = att.file instanceof File || (att.file_url && String(att.file_url).trim() !== "");
        const hasNotes = att.notes && String(att.notes).trim() !== "";
        return hasType || hasFile || hasNotes;
      });
      
      const attachmentsData = validAttachments.map((att, idx) => {
        const attData = {
          type: String(att.type || "main_contract").trim(),
          date: toIsoDate(att.date) || null,
          notes: String(att.notes || "").trim(),
          file_url: att.file_url || null,
          file_name: att.file_name || null,
        };
        return attData;
      });
      fd.append("attachments", JSON.stringify(attachmentsData));
      
      // ✅ إضافة الملفات الجديدة (باستخدام الفهرس الصحيح من validAttachments)
      validAttachments.forEach((att, idx) => {
        if (att.file instanceof File) {
          fd.append(`attachments[${idx}][file]`, att.file, att.file.name);
        }
      });
    } else {
      fd.append("attachments", "[]");
    }
    
    // إضافة الملفات القديمة (للتوافق)
    if (form.start_order_file && form.start_order_file instanceof File) {
      fd.append("start_order_file", form.start_order_file);
    }
    if (form.contract_file && form.contract_file instanceof File) {
      fd.append("contract_file", form.contract_file);
    }
    if (form.contract_appendix_file && form.contract_appendix_file instanceof File) {
      fd.append("contract_appendix_file", form.contract_appendix_file);
    }
    if (form.contract_explanation_file && form.contract_explanation_file instanceof File) {
      fd.append("contract_explanation_file", form.contract_explanation_file);
    }
    
    return fd;
  };

  const save = async () => {
    if (!projectId) {
      setErrorMsg(t("open_specific_project_to_save"));
      return;
    }
    try {
      const payload = buildPayload();
      
      // ✅ طباعة payload للتحقق (في وضع التطوير فقط)
      if (process.env.NODE_ENV === "development") {
        console.log("=== Contract Payload Debug ===");
        console.log("Extensions:", payload.get("extensions"));
        console.log("Attachments:", payload.get("attachments"));
        console.log("Owners:", payload.get("owners"));
        // طباعة جميع المفاتيح
        console.log("All FormData keys:", Array.from(payload.keys()));
      }
      
      const isHousing = form.contract_classification === "housing_loan_program";
      const hasFiles = 
        (form.start_order_file && form.start_order_file instanceof File) ||
        (form.contract_file && form.contract_file instanceof File) ||
        (form.contract_appendix_file && form.contract_appendix_file instanceof File) ||
        (form.contract_explanation_file && form.contract_explanation_file instanceof File);
      
      if (existingId) {
        await api.patch(`projects/${projectId}/contract/${existingId}/`, payload);
      } else {
        const { data: created } = await api.post(`projects/${projectId}/contract/`, payload);
        if (created?.id) setExistingId(created.id);
      }
      setErrorMsg("");
      
      // بعد الحفظ الناجح، نحدث URLs للملفات دائماً
      try {
        const { data } = await api.get(`projects/${projectId}/contract/`);
        if (Array.isArray(data) && data.length > 0) {
          const contractData = data[0];
          if (contractData.start_order_file) {
            setStartOrderFileUrl(contractData.start_order_file);
            setStartOrderFileName(extractFileNameFromUrl(contractData.start_order_file));
          }
          if (contractData.contract_file) {
            setContractFileUrl(contractData.contract_file);
            setContractFileName(extractFileNameFromUrl(contractData.contract_file));
          }
          if (contractData.contract_appendix_file) {
            setContractAppendixFileUrl(contractData.contract_appendix_file);
            setContractAppendixFileName(extractFileNameFromUrl(contractData.contract_appendix_file));
          }
          if (contractData.contract_explanation_file) {
            setContractExplanationFileUrl(contractData.contract_explanation_file);
            setContractExplanationFileName(extractFileNameFromUrl(contractData.contract_explanation_file));
          }
        }
      } catch (e) {
        console.error("Error loading contract file URLs:", e);
      }
      
      // إزالة File objects من form بعد الحفظ الناجح
      if (form.start_order_file instanceof File) setF("start_order_file", null);
      if (form.contract_file instanceof File) setF("contract_file", null);
      if (form.contract_appendix_file instanceof File) setF("contract_appendix_file", null);
      if (form.contract_explanation_file instanceof File) setF("contract_explanation_file", null);
      
      // ✅ إرسال حدث لتحديث بيانات المشروع في WizardPage
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("contract-updated", { detail: { projectId } }));
      }
      
      // عند الحفظ وانتقال للخطوة التالية، نضع في وضع view
      updateViewMode(true);
      
      if (!isHousing) {
        // التمويل الخاص - انتهاء، ننتقل للصفحة الرئيسية
        navigate("/projects");
        return;
      }
      
      // القرض السكني - الانتقال للخطوة التالية (أمر الترسية)
      // ✅ دائماً ننتقل للخطوة التالية إذا كان onNext متاحاً
      if (onNext && typeof onNext === "function") {
        onNext();
        return;
      }
      
      // ✅ إذا لم يكن onNext متاحاً، نبقى في وضع العرض بعد الحفظ
      // (updateViewMode(true) تم استدعاؤه بالفعل أعلاه)
    } catch (err) {
      // محاولة استخدام formatServerErrors أولاً
      const serverData = err?.response?.data;
      const formatted = formatServerErrors(serverData);
      
      // إذا لم يكن هناك تنسيق محدد، استخدم معالج الأخطاء الموحد
      if (formatted) {
        setErrorMsg(formatted);
      } else {
        const errorMessage = getErrorMessage(err, "حفظ العقد");
        setErrorMsg(errorMessage || t("save_failed"));
      }
    }
  };

  const isHousing = form.contract_classification === "housing_loan_program";
  // ✅ للقرض السكني: إذا كان هناك onNext، نعرض "حفظ و التالي"، وإلا "حفظ"
  const finishLabel = isHousing && onNext ? `${t("save_next")} →` : (isHousing ? t("save") : t("finish"));

  return (
    <WizardShell title={t("contract.title")}>
      <Dialog
        open={!!errorMsg}
        title={t("warning")}
        desc={<pre className="pre-wrap m-0">{errorMsg}</pre>}
        confirmLabel={t("ok")}
        onClose={() => setErrorMsg("")}
        onConfirm={() => setErrorMsg("")}
      />

      {viewMode && (
        <div className={`row ${isAR ? "justify-start" : "justify-end"} mb-12`}>
          <Button variant="secondary" onClick={() => updateViewMode(false)}>
            {t("edit")}
          </Button>
        </div>
      )}

      {/* الأقسام الثلاثة الأولى جنب بعض */}
      <div className="form-grid cols-3" style={{ gap: "var(--space-6)", alignItems: "flex-start" }}>
        {/* 1) تصنيف العقد */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
        }}>
          <h4 className="wizard-section-title" style={{ marginBottom: "20px" }}>1) {t("contract.sections.classification")}</h4>
          {viewMode ? (
            <div className="card">
              <div className="p-8 row row--align-center row--gap-8">
              <span>{CONTRACT_CLASSIFICATION.find(m => m.value === form.contract_classification)?.label || t("empty_value")}</span>
              {form.contract_classification && (
                <InfoTip
                  align="start"
                  text={
                    form.contract_classification === "housing_loan_program"
                      ? t("contract.classification.housing_loan_program.desc")
                      : t("contract.classification.private_funding.desc")
                  }
                />
              )}
              </div>
            </div>
          ) : (
            <div className="row row--align-center flex-wrap">
            <div className="chips flex-1">
              {CONTRACT_CLASSIFICATION.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`chip ${form.contract_classification === m.value ? "active" : ""}`}
                  onClick={() => setF("contract_classification", m.value)}
                  title={m.desc}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {form.contract_classification && (
              <InfoTip
                align="start"
                text={
                  form.contract_classification === "housing_loan_program"
                    ? t("contract.classification.housing_loan_program.desc")
                    : t("contract.classification.private_funding.desc")
                }
              />
            )}
            </div>
          )}
        </div>

        {/* 2) نوع العقد */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
        }}>
          <h4 className="wizard-section-title" style={{ marginBottom: "20px" }}>2) {t("contract.sections.type")}</h4>
          <Field label={t("contract.fields.contract_type")}>
            {viewMode ? (
              <div>{CONTRACT_TYPES.find((x) => x.value === form.contract_type)?.label || form.contract_type}</div>
            ) : (
              <RtlSelect
                className="rtl-select"
                dir={isAR ? "rtl" : "ltr"}
                options={CONTRACT_TYPES}
                value={form.contract_type}
                onChange={(v) => setF("contract_type", v)}
                placeholder={t("contract.placeholders.select_contract_type")}
              />
            )}
          </Field>
        </div>

        {/* 3) بيانات العقد */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
        }}>
          <h4 className="wizard-section-title" style={{ marginBottom: "20px" }}>3) {t("contract.sections.details")}</h4>
          {viewMode ? (
            <div className="form-grid cols-1" style={{ gap: "var(--space-4)" }}>
              <ViewRow
                label={t("contract.fields.contract_number")}
                value={form.tender_no}
                tip={isHousing ? t("contract.notes.housing_tender_info") : undefined}
              />
              <ViewRow
                label={t("contract.fields.contract_date")}
                value={form.contract_date}
                tip={form.contract_date ? `${t("contract.labels.day")}: ${getDayName(form.contract_date, i18next.language)}` : undefined}
              />
            </div>
          ) : (
            <div className="form-grid cols-1" style={{ gap: "var(--space-4)" }}>
              <Field label={t("contract.fields.contract_number")}>
                <div className="row row--align-center row--gap-8">
                  <input
                    className="input"
                    value={form.tender_no}
                    onChange={(e) => setF("tender_no", e.target.value)}
                    placeholder={t("contract.placeholders.contract_number")}
                  />
                  {isHousing && <InfoTip align="start" text={t("contract.notes.housing_tender_info")} />}
                </div>
              </Field>
              <Field label={t("contract.fields.contract_date")}>
                <div className="row row--align-center row--gap-8">
                  <input
                    className="input"
                    type="date"
                    value={form.contract_date || ""}
                    onChange={(e) => setF("contract_date", e.target.value)}
                  />
                  {form.contract_date && (
                    <InfoTip
                      align="start"
                      text={`${t("contract.labels.day")}: ${getDayName(form.contract_date, i18next.language)}`}
                    />
                  )}
                </div>
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* 2) مرفقات العقد */}
      <div className="wizard-section">
        <h4 className="wizard-section-title">2) مرفقات العقد</h4>
        {viewMode ? (
          <div>
            {form.attachments && form.attachments.length > 0 ? (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)", 
                gap: "var(--space-4)"
              }}>
                {form.attachments.map((att, idx) => {
                  // ✅ حساب عدد الملاحق السابقة (من نوع appendix فقط) - للعرض فقط
                  const previousAppendices = form.attachments
                    .slice(0, idx)
                    .filter(a => a.type === "appendix");
                  const appendixNumber = previousAppendices.length;
                  
                  return (
                    <ContractAttachment
                      key={idx}
                      attachment={att}
                      index={appendixNumber} // ✅ للعرض فقط (appendixNumber)
                      attachmentIndex={idx} // ✅ الفهرس الفعلي (للتوافق)
                      isView={true}
                      onUpdate={() => {}}
                      onRemove={() => {}}
                      canRemove={false}
                      projectId={projectId}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="card text-center prj-muted p-20">
                لا توجد مرفقات
              </div>
            )}
          </div>
        ) : (
          <div>
            {form.attachments && form.attachments.length > 0 && (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)", 
                gap: "var(--space-4)"
              }}>
                {form.attachments.map((att, idx) => {
                  // ✅ حساب عدد الملاحق السابقة (من نوع appendix فقط) - للعرض فقط
                  const previousAppendices = form.attachments
                    .slice(0, idx)
                    .filter(a => a.type === "appendix");
                  const appendixNumber = previousAppendices.length;
                  
                  return (
                    <ContractAttachment
                      key={idx}
                      attachment={att}
                      index={appendixNumber} // ✅ للعرض فقط (appendixNumber)
                      attachmentIndex={idx} // ✅ الفهرس الفعلي في المصفوفة
                      isView={false}
                      onUpdate={(attIndex, field, value) => {
                        // ✅ استخدام attIndex مباشرة (هو idx الفعلي)
                        const updated = [...form.attachments];
                        updated[attIndex] = { ...updated[attIndex], [field]: value };
                        setF("attachments", updated);
                      }}
                      onRemove={(attIndex) => {
                        // ✅ استخدام attIndex مباشرة (هو idx الفعلي)
                        const updated = form.attachments.filter((_, i) => i !== attIndex);
                        setF("attachments", updated);
                      }}
                      canRemove={true}
                      projectId={projectId}
                    />
                  );
                })}
              </div>
            )}
          
            <div className="mt-12">
              <Button
                onClick={() => {
                  const newAttachment = {
                    type: "", // ✅ لا نوع افتراضي - المستخدم يختار
                    date: "",
                    file: null,
                    file_url: null,
                    file_name: null,
                    notes: "",
                  };
                  setF("attachments", [...(form.attachments || []), newAttachment]);
                }}
                style={{ background: "#f97316", color: "white" }}
              >
                + إضافة مرفق
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4) أطراف العقد */}
      <div className="wizard-section">
        <h4 className="wizard-section-title">4) {t("contract.sections.parties")}</h4>
        <div className="form-grid cols-2" style={{ gap: "24px", alignItems: "flex-start" }}>
        {/* الطرف الأول - المالك */}
        <div style={{ 
          background: "var(--surface)", 
          borderRadius: "12px", 
          padding: "24px",
          border: "1px solid var(--border)"
        }}>
          <h5 style={{ 
            margin: "0 0 20px 0", 
            fontSize: "18px", 
            fontWeight: "600",
            color: "var(--text)",
            paddingBottom: "12px",
            borderBottom: "2px solid var(--primary)"
          }}>
            {t("contract.fields.first_party_owner") || "الطرف الأول (المالك)"}
          </h5>
          {form.owners?.length ? (
            <div>
              {form.owners.map((o, i) => {
                return (
                  <div key={i} style={{ marginBottom: i < form.owners.length - 1 ? "24px" : "0" }}>
                    <div className="form-grid cols-2" style={{ gap: "var(--space-4)" }}>
                      {/* ✅ بيانات للعرض فقط - من SitePlan */}
                      <Field label={t("owner_name_ar") || "الاسم (عربي)"}>
                        {viewMode ? (
                          <div style={{ 
                            padding: "12px", 
                            background: "var(--surface-2)", 
                            borderRadius: "8px",
                            fontSize: "16px",
                            color: "var(--text)",
                            fontWeight: "500"
                          }}>
                            {o.owner_name_ar || t("empty_value")}
                          </div>
                        ) : (
                          <input
                            className="input"
                            readOnly
                            value={o.owner_name_ar || ""}
                            style={{
                              background: "var(--surface-2)",
                              color: "var(--text)",
                              cursor: "default"
                            }}
                          />
                        )}
                      </Field>
                      
                      <Field label={t("owner_name_en") || "الاسم (English)"}>
                        {viewMode ? (
                          <div style={{ 
                            padding: "12px", 
                            background: "var(--surface-2)", 
                            borderRadius: "8px",
                            fontSize: "16px",
                            color: "var(--text)",
                            fontWeight: "500"
                          }}>
                            {o.owner_name_en || t("empty_value")}
                          </div>
                        ) : (
                          <input
                            className="input"
                            type="text"
                            value={o.owner_name_en || ""}
                            onChange={(e) => {
                              const updated = [...form.owners];
                              updated[i] = { ...updated[i], owner_name_en: e.target.value };
                              setF("owners", updated);
                            }}
                            placeholder="Enter name in English"
                          />
                        )}
                      </Field>
                      
                      <Field label={t("id_number") || "رقم الهوية"}>
                        {viewMode ? (
                          <div style={{ 
                            padding: "12px", 
                            background: "var(--surface-2)", 
                            borderRadius: "8px",
                            fontSize: "16px",
                            color: "var(--text)",
                            fontWeight: "500"
                          }}>
                            {o.id_number || t("empty_value")}
                          </div>
                        ) : (
                          <input
                            className="input"
                            readOnly
                            value={o.id_number || ""}
                            style={{
                              background: "var(--surface-2)",
                              color: "var(--text)",
                              cursor: "default"
                            }}
                          />
                        )}
                      </Field>
                      
                      {/* ✅ حقل تاريخ الانتهاء مخفي */}
                      <div></div>
                      
                      {/* ✅ حقول قابلة للإدخال - الهاتف والبريد */}
                      <Field label={t("phone") || "الهاتف"}>
                        {viewMode ? (
                          <div style={{ 
                            padding: "12px", 
                            background: "var(--surface-2)", 
                            borderRadius: "8px",
                            fontSize: "16px",
                            color: "var(--text)",
                            fontWeight: "500"
                          }}>
                            {o.phone || t("empty_value")}
                          </div>
                        ) : (
                          <input
                            className="input"
                            type="tel"
                            value={o.phone || ""}
                            onChange={(e) => {
                              const formatted = formatUAEPhone(e.target.value);
                              const updated = [...form.owners];
                              updated[i] = { ...updated[i], phone: formatted };
                              setF("owners", updated);
                            }}
                            placeholder="+971XXXXXXXXX"
                          />
                        )}
                      </Field>
                      
                      <Field label={t("email") || "البريد الإلكتروني"}>
                        {viewMode ? (
                          <div style={{ 
                            padding: "12px", 
                            background: "var(--surface-2)", 
                            borderRadius: "8px",
                            fontSize: "16px",
                            color: "var(--text)",
                            fontWeight: "500"
                          }}>
                            {o.email || t("empty_value")}
                          </div>
                        ) : (
                          <input
                            className="input"
                            type="email"
                            value={o.email || ""}
                            onChange={(e) => {
                              const updated = [...form.owners];
                              updated[i] = { ...updated[i], email: e.target.value };
                              setF("owners", updated);
                            }}
                            placeholder="example@email.com"
                          />
                        )}
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="row row--align-center row--gap-8">
              <InfoTip align="start" text={t("contract.notes.no_owners_siteplan")} />
            </div>
          )}
          </div>

          {/* الطرف الثاني - المقاول */}
        <div style={{ 
          background: "var(--surface)", 
          borderRadius: "12px", 
          padding: "24px",
          border: "1px solid var(--border)"
        }}>
          <h5 style={{ 
            margin: "0 0 20px 0", 
            fontSize: "18px", 
            fontWeight: "600",
            color: "var(--text)",
            paddingBottom: "12px",
            borderBottom: "2px solid var(--primary)"
          }}>
            {t("contract.fields.second_party_contractor") || "الطرف الثاني (المقاول)"}
          </h5>
          <PersonField
            type="contractor"
            label={t("contractor")}
            licenseLabel={t("contractor_lic")}
            nameValue={form.contractor_name}
            nameEnValue={form.contractor_name_en}
            licenseValue={form.contractor_trade_license}
            phoneValue={form.contractor_phone}
            emailValue={form.contractor_email}
            onNameChange={(v) => setF("contractor_name", v)}
            onNameEnChange={(v) => setF("contractor_name_en", v)}
            onLicenseChange={(v) => setF("contractor_trade_license", v)}
            onPhoneChange={(v) => setF("contractor_phone", v)}
            onEmailChange={(v) => setF("contractor_email", v)}
            isView={viewMode}
          />
        </div>
        </div>
      </div>

      {/* 5) قيمة العقد والمدة */}
      <div className="wizard-section">
        <h4 className="wizard-section-title">5) {t("contract.sections.value_duration")} (القيم المالية الحقيقية)</h4>
        {viewMode ? (
          <div className="form-grid cols-4" style={{ gap: "var(--space-4)" }}>
            <Field label={t("contract_amount")}>
            <div>
              <div className="font-mono fw-600">
                {formatMoney(form.total_project_value)}
              </div>
                  <div className="mini mt-8">
                    {formatMoneyArabic(form.total_project_value)}
                  </div>
                  {form.total_project_value && (
                    <div className="mini mt-8 font-italic">
                      {numberToArabicWords(form.total_project_value)}
                    </div>
                  )}
            </div>
            </Field>
            {isHousing && (
            <>
              <Field label={t("contract.fields.total_bank_value")}>
                <div>
                  <div className="font-mono fw-600">
                    {formatMoney(form.total_bank_value)}
                  </div>
                  <div className="mini mt-8">
                    {formatMoneyArabic(form.total_bank_value)}
                  </div>
                  {form.total_bank_value && (
                    <div className="mini mt-8 font-italic">
                      {numberToArabicWords(form.total_bank_value)}
                    </div>
                  )}
                </div>
              </Field>
              <Field label={t("contract.fields.total_owner_value_calc")}>
                <div>
                  <div className="font-mono fw-600">
                    {formatMoney(form.total_owner_value)}
                  </div>
                  <div className="mini mt-8">
                    {formatMoneyArabic(form.total_owner_value)}
                  </div>
                  {form.total_owner_value && (
                    <div className="mini mt-8 font-italic">
                      {numberToArabicWords(form.total_owner_value)}
                    </div>
                  )}
                </div>
              </Field>
            </>
            )}
            <ViewRow label={t("contract.fields.project_duration_months")} value={form.project_duration_months} />
          </div>
        ) : (
          <div className="form-grid cols-4" style={{ gap: "var(--space-4)" }}>
          <Field label={t("contract.fields.total_project_value")}>
            <NumberField
              value={form.total_project_value}
              onChange={(v) => setF("total_project_value", v)}
            />
          </Field>
          {isHousing && (
            <>
              <Field label={t("contract.fields.total_bank_value")}>
                <NumberField
                  value={form.total_bank_value}
                  onChange={(v) => setF("total_bank_value", v)}
                />
              </Field>
              <Field label={t("contract.fields.total_owner_value_calc")}>
                <NumberField
                  value={form.total_owner_value}
                  onChange={() => {}}
                  readOnly
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    cursor: "default"
                  }}
                />
                {form.total_owner_value && (
                  <div className="mini mt-4">
                    {numberToArabicWords(form.total_owner_value)}
                  </div>
                )}
              </Field>
            </>
          )}
          <Field label={t("contract.fields.project_duration_months")}>
            <input
              className="input"
              type="number"
              min="0"
              value={form.project_duration_months}
              onChange={(e) => setF("project_duration_months", e.target.value)}
              placeholder={t("empty_value")}
            />
          </Field>
          </div>
        )}
      </div>

      {/* 6) أتعاب الاستشاري */}
      <div className="wizard-section">
        <h4 className="wizard-section-title">6) {t("contract.sections.consultant_fees")}</h4>
        <div className="form-grid cols-2" style={{ gap: "var(--space-6)", alignItems: "flex-start" }}>
          <div style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid var(--border)"
          }}>
            <h5 style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--text)",
              paddingBottom: "12px",
              borderBottom: "2px solid var(--primary)"
            }}>
              {t("contract.fees.owner.title") || "الجزء الممول من المالك"}
            </h5>
            <ConsultantFeesSection prefix="owner" form={form} setF={setF} isView={viewMode} isAR={isAR} />
          </div>
          
          <div style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid var(--border)"
          }}>
            <h5 style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--text)",
              paddingBottom: "12px",
              borderBottom: "2px solid var(--primary)"
            }}>
              {t("contract.fees.bank.title") || "الجزء الممول من البنك"}
            </h5>
            <ConsultantFeesSection prefix="bank" form={form} setF={setF} isView={viewMode} isAR={isAR} />
          </div>
        </div>
      </div>

      {/* 7) أمر المباشرة */}
      <div className="wizard-section">
        <h4 className="wizard-section-title">7) {t("start_order_title")}</h4>
        {viewMode ? (
          <div className="form-grid cols-3" style={{ gap: "var(--space-4)" }}>
            <ViewRow
              label={t("start_order_exists")}
              value={form.has_start_order === "yes" ? t("yes") : t("no")}
            />
            {form.has_start_order === "yes" && (
              <>
                <Field label={t("start_order_file")}>
                  <FileAttachmentView
                    fileUrl={startOrderFileUrl}
                    fileName={startOrderFileName || (startOrderFileUrl ? extractFileNameFromUrl(startOrderFileUrl) : "") || (form.start_order_file?.name || "")}
                    projectId={projectId}
                    endpoint={`projects/${projectId}/contract/`}
                  />
                </Field>
                <ViewRow label={t("start_order_date")} value={form.start_order_date} />
                <ViewRow label={t("project_end_date_calculated")} value={form.project_end_date} />
              </>
            )}
          </div>
        ) : (
          <div className="form-grid cols-3" style={{ gap: "var(--space-4)" }}>
          <Field label={t("start_order_exists")}>
            <YesNoChips
              value={form.has_start_order}
              onChange={(v) => setF("has_start_order", v)}
            />
          </Field>
          {form.has_start_order === "yes" && (
            <>
              <Field label={t("attach_start_order")}>
                <div className="row row--align-center row--gap-8">
                  <div style={{ flex: 1 }}>
                    <FileUpload
                      value={form.start_order_file}
                      onChange={(file) => {
                        setF("start_order_file", file);
                        if (file) {
                          setStartOrderFileName(file.name);
                        }
                      }}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      maxSizeMB={10}
                      showPreview={true}
                      existingFileUrl={startOrderFileUrl}
                      existingFileName={startOrderFileName || (startOrderFileUrl ? extractFileNameFromUrl(startOrderFileUrl) : "")}
                      onRemoveExisting={() => {
                        setF("start_order_file", null);
                        setStartOrderFileName("");
                      }}
                      compressionOptions={{
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                      }}
                    />
                  </div>
                  <InfoTip align="start" text={t("start_order_required")} />
                </div>
              </Field>
              {/* عرض حقول التاريخ إذا كان هناك ملف (جديد أو موجود سابقاً) */}
              {(form.start_order_file || startOrderFileUrl) && (
                <>
                  <Field label={t("start_order_date")}>
                    <input
                      type="date"
                      className="input"
                      value={form.start_order_date || ""}
                      onChange={(e) => setF("start_order_date", e.target.value)}
                    />
                  </Field>
                  <Field label={t("project_end_date_calculated")}>
                    <input
                      className="input"
                      value={form.project_end_date}
                      readOnly
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        cursor: "default"
                      }}
                    />
                  </Field>
                </>
              )}
            </>
          )}
          </div>
        )}
      </div>

      {/* 8) التمديدات */}
      <div className="wizard-section">
        <h4 className="wizard-section-title">8) التمديدات</h4>
        {viewMode ? (
          <div>
            {form.extensions && form.extensions.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
                gap: "16px"
              }}>
                {form.extensions.map((ext, idx) => (
                  <div key={idx} style={{
                    background: "var(--surface)",
                    borderRadius: "12px",
                    padding: "20px",
                    border: "1px solid var(--border)",
                    direction: "rtl"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                      <Field label="سبب التمديد">
                        <input
                          className="input"
                          type="text"
                          value={ext.reason || ""}
                          readOnly
                          style={{
                            background: "var(--surface-2)",
                            color: "var(--text)",
                            cursor: "default"
                          }}
                          dir="rtl"
                        />
                      </Field>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <Field label="مدة التمديد (أيام)">
                          <input
                            className="input"
                            type="number"
                            value={ext.days || 0}
                            readOnly
                            style={{
                              background: "var(--surface-2)",
                              color: "var(--text)",
                              cursor: "default"
                            }}
                            dir="rtl"
                          />
                        </Field>
                        <Field label="مدة التمديد (شهور)">
                          <input
                            className="input"
                            type="number"
                            value={ext.months || 0}
                            readOnly
                            style={{
                              background: "var(--surface-2)",
                              color: "var(--text)",
                              cursor: "default"
                            }}
                            dir="rtl"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="row row--align-center row--gap-8">
                <InfoTip align="start" text="لا توجد تمديدات" />
              </div>
            )}
          </div>
        ) : (
          <div>
            {form.extensions && form.extensions.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
                gap: "16px"
              }}>
                {form.extensions.map((ext, idx) => (
                  <div key={idx} style={{
                    background: "var(--surface)",
                    borderRadius: "12px",
                    padding: "20px",
                    border: "1px solid var(--border)",
                    direction: "rtl"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                      <Field label="سبب التمديد">
                        <input
                          className="input"
                          type="text"
                          value={ext.reason || ""}
                          onChange={(e) => {
                            const updated = [...form.extensions];
                            updated[idx] = { ...updated[idx], reason: e.target.value };
                            setF("extensions", updated);
                          }}
                          placeholder="أدخل سبب التمديد"
                          dir="rtl"
                        />
                      </Field>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <Field label="مدة التمديد (أيام)">
                          <NumberField
                            value={ext.days || ""}
                            onChange={(v) => {
                              const updated = [...form.extensions];
                              updated[idx] = { ...updated[idx], days: v ? Number(v) : 0 };
                              setF("extensions", updated);
                            }}
                            min={0}
                            placeholder="0"
                            dir="rtl"
                          />
                        </Field>
                        <Field label="مدة التمديد (شهور)">
                          <NumberField
                            value={ext.months || ""}
                            onChange={(v) => {
                              const updated = [...form.extensions];
                              updated[idx] = { ...updated[idx], months: v ? Number(v) : 0 };
                              setF("extensions", updated);
                            }}
                            min={0}
                            placeholder="0"
                            dir="rtl"
                          />
                        </Field>
                      </div>
                    </div>
                    <div className={`row ${isAR ? "row--justify-start" : "row--justify-end"} mt-8`}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const updated = form.extensions.filter((_, i) => i !== idx);
                          setF("extensions", updated);
                        }}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className={`row ${isAR ? "row--justify-start" : "row--justify-end"} mt-8`}>
              <Button
                variant="secondary"
                onClick={() => {
                  const updated = [...(form.extensions || []), { reason: "", days: 0, months: 0 }];
                  setF("extensions", updated);
                }}
              >
                + إضافة تمديد
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 9) الملاحظات العامة */}
      <div className="wizard-section">
        <h4 className="wizard-section-title">9) ملاحظات عامة</h4>
        {viewMode ? (
          <Field label="ملاحظات عامة">
            <div className="pre-wrap">{form.general_notes || t("empty_value")}</div>
          </Field>
        ) : (
          <Field label="ملاحظات عامة">
            <textarea
              className="input"
              rows={5}
              value={form.general_notes || ""}
              onChange={(e) => setF("general_notes", e.target.value)}
              placeholder="أدخل الملاحظات العامة..."
            />
          </Field>
        )}
      </div>

      {!viewMode && (
        <StepActions
          onPrev={onPrev}
          onNext={save}
          nextLabel={hasNextStep ? finishLabel : t("save")}
          nextClassName="primary"
        />
      )}
    </WizardShell>
  );
}
