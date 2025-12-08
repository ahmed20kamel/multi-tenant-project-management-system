import { useMemo, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import InfoTip from "../components/InfoTip";
import Dialog from "../../../../components/common/Dialog";
import Chips from "../../../../components/ui/Chips";
import Button from "../../../../components/common/Button";
import Field from "../../../../components/forms/Field";
import { api } from "../../../../services/api";
import { PROJECT_TYPES, VILLA_CATEGORIES, CONTRACT_TYPES } from "../../../../utils/constants";
import { formatInternalCode, isLastDigitOdd, toDigits } from "../../../../utils/internalCodeFormatter";

export default function ProjectSetupStep({
  value,
  onChange,
  onNext,
  onPrev,
  isView,
  onSaved, // اختياري: يُستدعى بعد الحفظ الناجح (مثلاً لإعادة تحميل المشروع في صفحة العرض)
  isNewProject = false, // ✅ مشروع جديد بدون projectId
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isAR = lang === "ar";
  const { projectId } = useParams();

  const { projectType, villaCategory, contractType, internalCode } = value || {};
  const set = (k, v) => onChange({ ...value, [k]: v });

  const baseSelected =
    !!projectType && (projectType !== "villa" || !!villaCategory) && !!contractType;

  const allowSitePlanFlow =
    projectType === "villa" &&
    (villaCategory === "residential" || villaCategory === "commercial") &&
    contractType === "new";

  const canProceed = baseSelected && allowSitePlanFlow;
  const hasNextStep = typeof onNext === "function";

  const [errorMsg, setErrorMsg] = useState("");
  const internalCodeInputRef = useRef(null);

  const [viewMode, setViewMode] = useState(() => {
    if (isView !== undefined) return isView === true;
    return false;
  });

  useEffect(() => {
    if (isView !== undefined) {
      setViewMode(isView === true);
    }
  }, [isView]);

  const isReadOnly = viewMode === true;

  // ✅ تحميل البيانات من الـ backend عند فتح الصفحة
  useEffect(() => {
    if (!projectId) return;
    
    let mounted = true;
    
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/`);
        if (!mounted) return;
        
        // ✅ تحديث الحالة بالبيانات من الـ backend فقط إذا كانت مختلفة
        const newData = {
          projectType: data?.project_type || "",
          villaCategory: data?.villa_category || "",
          contractType: data?.contract_type || "",
          internalCode: data?.internal_code || "",
        };
        
        // ✅ تحديث فقط إذا كانت البيانات مختلفة
        if (
          newData.projectType !== (value?.projectType || "") ||
          newData.villaCategory !== (value?.villaCategory || "") ||
          newData.contractType !== (value?.contractType || "") ||
          newData.internalCode !== (value?.internalCode || "")
        ) {
          onChange(newData);
        }
      } catch (e) {
        console.error("Error loading project data:", e);
      }
    })();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  
  // ✅ معالج بسيط للكود الداخلي: يحفظ الأرقام فقط، و M تضاف في العرض فقط
  const handleInternalCodeChange = (e) => {
    const raw = e.target.value || "";
    const digits = toDigits(raw);
    // نحفظ في الـ state الأرقام فقط؛ التنسيق (M + الأرقام) يتم عند العرض
    set("internalCode", digits);
  };

  const labels = {
    pageTitle: t("wizard_step_setup"),
    categoryTitle: t("setup_project_category_title"),
    subcatsTitle: t("setup_subcategories_title"),
    contractTypeTitle: t("setup_contract_type_title"),
    internalCodeTitle: t("internal_project_code"),
    internalCodeHelp: t("internal_code_help"),
    internalCodePlaceholder: t("internal_code_placeholder"),
    readyNote: t("setup_ready_note"),
    helpSelectAll: t("setup_help_select_all"),
    helpPathOnly: t("setup_help_path_only"),
    edit: t("edit"),
  };

  const chipsProjectTypes = useMemo(() => PROJECT_TYPES[isAR ? "ar" : "en"], [isAR]);
  const villaSubcategories = useMemo(() => VILLA_CATEGORIES[isAR ? "ar" : "en"], [isAR]);
  const contractTypes = useMemo(() => CONTRACT_TYPES[isAR ? "ar" : "en"], [isAR]);

  const labelMap = useMemo(() => {
    const m = (pairs) =>
      pairs.reduce((acc, [v, label]) => {
        acc[v] = label;
        return acc;
      }, {});
    return {
      projectType: m(chipsProjectTypes),
      villaCategory: m(villaSubcategories),
      contractType: m(contractTypes),
    };
  }, [chipsProjectTypes, villaSubcategories, contractTypes]);

  const handleSaveAndNext = async () => {
    // ✅ التحقق من الكود الداخلي
    const formatted = formatInternalCode(internalCode);
    if (formatted && !isLastDigitOdd(formatted)) {
      setErrorMsg(t("internal_code_last_digit_error"));
      return;
    }

    // ✅ إذا كان مشروع جديد، نحفظ البيانات مؤقتاً فقط وننتقل للخطوة التالية
    if (isNewProject) {
      // تحديث setup مع الكود الداخلي
      onChange({
        ...value,
        internalCode: formatted,
      });
      
      if (onNext && canProceed) {
        onNext();
      }
      return;
    }

    // ✅ إذا كان مشروع موجود، نحفظ في DB
    if (!projectId) {
      setErrorMsg(t("open_specific_project_to_save"));
      return;
    }

    try {
      setErrorMsg("");
      const payload = {
        project_type: projectType || null,
        villa_category: projectType === "villa" ? (villaCategory || null) : null,
        contract_type: contractType || null,
        internal_code: formatted,
      };

      await api.patch(`projects/${projectId}/`, payload);

      // في حالة صفحة العرض: نسمح للأب بإعادة تحميل بيانات المشروع من الـ backend
      if (typeof onSaved === "function") {
        onSaved();
      }

      if (onNext && canProceed) {
        onNext();
      } else {
        // لا يوجد خطوة تالية أو لا يمكن المتابعة → العودة لوضع العرض
        setViewMode(true);
      }
    } catch (e) {
      const msg = e?.response?.data
        ? JSON.stringify(e.response.data, null, 2)
        : e.message || t("save_project_error");
      setErrorMsg(msg);
    }
  };

  return (
    <WizardShell title={labels.pageTitle}>
      <Dialog
        open={!!errorMsg}
        title={t("error")}
        desc={<pre className="pre-wrap" style={{ margin: 0 }}>{errorMsg}</pre>}
        confirmLabel={t("ok")}
        onClose={() => setErrorMsg("")}
        onConfirm={() => setErrorMsg("")}
      />

      {/* زر تعديل أعلى الصفحة مثل SitePlanStep */}
      {isReadOnly && (
        <div className={`row ${isAR ? "justify-start" : "justify-end"} mb-12`}>
          <Button variant="secondary" onClick={() => setViewMode(false)}>
            {labels.edit}
          </Button>
        </div>
      )}

      {/* الكود الداخلي */}
      <div className="wizard-section">
        <h4 className="wizard-section-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {labels.internalCodeTitle}
          <InfoTip inline align="start" text={labels.internalCodeHelp} />
        </h4>
        {isReadOnly ? (
        <div className="card" role="group" aria-label={labels.internalCodeTitle}>
          <div className="p-8 mono">
            {(internalCode && formatInternalCode(internalCode)) || t("empty_value")}
          </div>
        </div>
      ) : (
        <div className="card" role="group" aria-label={labels.internalCodeTitle}>
          <div className="p-8">
            <Field>
              <input
                ref={internalCodeInputRef}
                type="text"
                inputMode="numeric"
                className="input w-100 mono"
                placeholder={labels.internalCodePlaceholder}
                value={formatInternalCode(internalCode || "")}
                onChange={handleInternalCodeChange}
                onKeyDown={(e) => {
                  // ✅ منع حذف "M" فقط في حالة واحدة: إذا كانت القيمة "M" فقط (لا توجد أرقام)
                  if (e.key === "Backspace" || e.key === "Delete") {
                    const input = e.target;
                    const cursorPos = input.selectionStart;
                    const value = input.value;
                    
                    // ✅ منع حذف "M" فقط إذا كانت القيمة "M" فقط (لا توجد أرقام بعدها)
                    if (value === "M" && cursorPos <= 1) {
                      e.preventDefault();
                      return;
                    }
                    
                    // ✅ السماح بجميع عمليات الحذف الأخرى (حذف الأرقام، إلخ)
                  }
                }}
                aria-describedby="internal-code-help"
                maxLength={40}
              />
            </Field>
            <div id="internal-code-help" className="muted mt-4">
              {labels.internalCodeHelp}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* تصنيف المشروع */}
      <h4 className="inline-flex ai-center gap-6 mt-12">
        {labels.categoryTitle}
        <InfoTip
          inline
          wide
          align="start"
          text={
            canProceed
              ? labels.readyNote
              : baseSelected
              ? labels.helpPathOnly
              : labels.helpSelectAll
          }
          title={t("info")}
        />
      </h4>

      {isReadOnly ? (
        <div className="card" role="group" aria-label={labels.categoryTitle}>
          <div className="p-8">{labelMap.projectType[projectType] || t("empty_value")}</div>
        </div>
      ) : (
        <Chips
          options={chipsProjectTypes}
          value={projectType}
          onChange={(v) => set("projectType", v)}
        />
      )}

      {projectType === "villa" && (
        <>
          <h4 className="mt-12 inline-flex ai-center gap-6">
            {labels.subcatsTitle}
            <InfoTip
              inline
              align="start"
              text={t("pick_villa_type")}
            />
          </h4>
          {isReadOnly ? (
            <div className="card" role="group" aria-label={labels.subcatsTitle}>
              <div className="p-8">{labelMap.villaCategory[villaCategory] || t("empty_value")}</div>
            </div>
          ) : (
            <Chips
              options={villaSubcategories}
              value={villaCategory}
              onChange={(v) => set("villaCategory", v)}
            />
          )}
        </>
      )}

      <h4 className="mt-12 inline-flex ai-center gap-6">
        {labels.contractTypeTitle}
        <InfoTip
          inline
          align="start"
              text={t("contract_type_info")}
        />
      </h4>

      {isReadOnly ? (
        <div className="card" role="group" aria-label={labels.contractTypeTitle}>
          <div className="p-8">{labelMap.contractType[contractType] || t("empty_value")}</div>
        </div>
      ) : (
        <Chips
          options={contractTypes}
          value={contractType}
          onChange={(v) => set("contractType", v)}
        />
      )}

      {!isReadOnly && (
        <StepActions
          onPrev={onPrev}
          onNext={handleSaveAndNext}
          disableNext={!baseSelected}
          nextClassName={baseSelected ? "pulse" : ""}
          nextLabel={hasNextStep ? t("save_next_arrow") : t("save")}
        />
      )}
    </WizardShell>
  );
}
