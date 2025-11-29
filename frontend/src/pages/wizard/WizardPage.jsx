import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";
import { api } from "../../services/api";
import Button from "../../components/Button";

import useWizardState from "./hooks/useWizardState";
import useProjectData from "../../hooks/useProjectData";
import ProjectSetupStep from "./steps/ProjectSetupStep";
import SitePlanStep from "./steps/SitePlanStep";
import LicenseStep from "./steps/LicenseStep";
import ContractStep from "./steps/ContractStep";
import SetupSummary from "./components/SetupSummary.jsx";
import InfoTip from "./components/InfoTip";
import AwardingStep from "./steps/AwardingStep";

const EMPTY_SETUP = { projectType: "", villaCategory: "", contractType: "" };
const STEP_INDEX = { setup: 0, siteplan: 1, license: 2, contract: 3, award: 4 };

export default function WizardPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isAR = /^ar\b/i.test(lang || "");
  const navigate = useNavigate();
  const location = useLocation();

  const { projectId } = useParams();
  const [params] = useSearchParams();

  // ✅ تحديد إذا كان هذا مشروع جديد (بدون projectId)
  const isNewProject = !projectId || location.pathname === "/wizard/new";

  const mode = (params.get("mode") || "edit").toLowerCase();
  const isView = mode === "view";
  const stepParam = (params.get("step") || "setup").toLowerCase();

  const { setup, setSetup } = useWizardState();

  const [project, setProject] = useState(null);
  const [contract, setContract] = useState(null);
  const [index, setIndex] = useState(0);
  
  // ✅ حالة إنشاء المشروع
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  // ✅ إعادة تعيين index إلى 0 عند فتح مشروع جديد
  useEffect(() => {
    if (isNewProject) {
      setIndex(0);
    }
  }, [isNewProject]);
  
  // ✅ جلب بيانات المشروع للتحقق من المراحل المكتملة (فقط إذا كان projectId موجود)
  const projectData = useProjectData(isNewProject ? null : projectId);
  const { siteplan, license, contract: contractData, awarding, reload } = projectData;

  // ✅ الاستماع لأحداث تحديث البيانات وإعادة تحميلها بدون reload
  useEffect(() => {
    if (isNewProject || !projectId || !reload) return;
    
    const handleDataUpdate = (event) => {
      if (event.detail?.projectId === projectId) {
        // ✅ إعادة تحميل البيانات فقط بدون reload للصفحة
        reload();
      }
    };
    
    // ✅ الاستماع لجميع أحداث التحديث
    window.addEventListener("license-updated", handleDataUpdate);
    window.addEventListener("contract-updated", handleDataUpdate);
    window.addEventListener("awarding-updated", handleDataUpdate);
    window.addEventListener("siteplan-owners-updated", handleDataUpdate);
    
    return () => {
      window.removeEventListener("license-updated", handleDataUpdate);
      window.removeEventListener("contract-updated", handleDataUpdate);
      window.removeEventListener("awarding-updated", handleDataUpdate);
      window.removeEventListener("siteplan-owners-updated", handleDataUpdate);
    };
  }, [projectId, isNewProject, reload]);

  useEffect(() => {
    if (isNewProject) {
      // ✅ مشروع جديد - مسح البيانات القديمة وإعادة تعيين القيم الافتراضية
      setSetup({
        projectType: "",
        villaCategory: "",
        contractType: "",
        internalCode: "",
      });
      // مسح localStorage للويزارد
      try {
        localStorage.removeItem("wizard_setup_state_v1");
      } catch {}
      return;
    }
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/`);
        setProject(data);
        setSetup({
          projectType: data?.project_type || "",
          villaCategory: data?.villa_category || "",
          contractType: data?.contract_type || "",
          internalCode: data?.internal_code || "",
        });
      } catch {}
    })();
  }, [projectId, setSetup, isNewProject]);

  const setupHasAllSelections = (s = setup) =>
    !!s.projectType && (s.projectType !== "villa" || !!s.villaCategory) && !!s.contractType;

  const allowSitePlanFlow =
    setup.projectType === "villa" &&
    (setup.villaCategory === "residential" || setup.villaCategory === "commercial") &&
    setup.contractType === "new";

  // تحميل بيانات العقد لتحديد نوع التمويل
  useEffect(() => {
    if (isNewProject || !projectId || !allowSitePlanFlow) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/contract/`);
        if (mounted && Array.isArray(data) && data.length > 0) {
          setContract(data[0]);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [projectId, allowSitePlanFlow, isNewProject]);

  const labels = {
    setup: t("wizard_step_setup"),
    siteplan: t("wizard_step_siteplan"),
    license: t("wizard_step_license"),
    contract: t("wizard_step_contract"),
    award: t("wizard_step_award"),
    projectPrefix: t("wizard_project_prefix"),
    home: t("wizard_home"),
    infoNote: t("wizard_info_note"),
  };

  // تحديد ما إذا كان التمويل خاص (يحتاج AwardingStep)
  const isPrivateFunding = contract?.contract_classification === "private_funding";
  const isHousingLoan = contract?.contract_classification === "housing_loan_program";

  const STEPS = useMemo(() => {
    const base = [{ id: "setup", title: labels.setup, Component: ProjectSetupStep }];
    if (!allowSitePlanFlow) return base;
    
    const steps = [
      ...base,
      { id: "siteplan", title: labels.siteplan, Component: SitePlanStep },
      { id: "license", title: labels.license, Component: LicenseStep },
      { id: "contract", title: labels.contract, Component: ContractStep },
    ];
    
    // إضافة AwardingStep فقط للقرض السكني (وليس للتمويل الخاص)
    // إذا لم يكن هناك contract بعد، نضيف AwardingStep كخيار افتراضي
    // إذا كان هناك contract وكان housing_loan، نضيف AwardingStep
    // إذا كان هناك contract وكان private_funding، لا نضيف AwardingStep
    const shouldAddAwardingStep = !contract || isHousingLoan;
    if (shouldAddAwardingStep) {
      steps.push({ id: "award", title: labels.award, Component: AwardingStep });
    }
    
    return steps;
  }, [allowSitePlanFlow, contract, isHousingLoan, isPrivateFunding, labels.setup, labels.siteplan, labels.license, labels.contract, labels.award]);

  useEffect(() => {
    const wanted = STEP_INDEX[stepParam] ?? 0;
    const maxIndex = allowSitePlanFlow ? (STEPS.length - 1) : 0;
    setIndex(Math.min(wanted, maxIndex));
  }, [stepParam, allowSitePlanFlow, STEPS.length]);

  // التأكد من أن index صالح بعد تحديث STEPS (مثلاً إذا تم إزالة AwardingStep)
  useEffect(() => {
    if (index >= STEPS.length) {
      setIndex(Math.max(0, STEPS.length - 1));
    }
  }, [STEPS.length, index]);

  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const goPrev = () => !isFirst && setIndex((i) => i - 1);
  const goNext = () => !isLast && setIndex((i) => i + 1);

  const canEnter = (i) => {
    if (i === 0) return true;
    if (!allowSitePlanFlow) return false;
    return setupHasAllSelections();
  };
  const onStepClick = (i) => {
    if (canEnter(i)) setIndex(i);
  };

  // ✅ دالة إنشاء المشروع بعد إتمام المرحلتين الأولى والثانية
  const createProjectAndSaveData = async (setupData, sitePlanData) => {
    try {
      setIsCreatingProject(true);
      
      // 1. إنشاء المشروع الأساسي
      const projectPayload = {
        status: "draft",
        project_type: setupData.projectType || null,
        villa_category: setupData.projectType === "villa" ? (setupData.villaCategory || null) : null,
        contract_type: setupData.contractType || null,
        internal_code: setupData.internalCode || null,
      };
      
      const projectRes = await api.post("projects/", projectPayload);
      const newProjectId = projectRes?.data?.id;
      
      if (!newProjectId) {
        throw new Error("Failed to create project");
      }
      
      // 2. حفظ بيانات مخطط الأرض
      if (sitePlanData) {
        const sitePlanPayload = sitePlanData; // FormData
        const config = sitePlanPayload instanceof FormData 
          ? {
              headers: { "Content-Type": "multipart/form-data" },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  // يمكن إضافة progress indicator هنا إذا لزم الأمر
                }
              },
            }
          : { headers: { "Content-Type": "application/json" } };
        
        await api.post(`projects/${newProjectId}/siteplan/`, sitePlanPayload, config);
      }
      
      // 3. الانتقال إلى صفحة الويزارد بالمشروع الجديد
      navigate(`/projects/${newProjectId}/wizard?step=license`);
      
    } catch (err) {
      console.error("Error creating project:", err);
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message || t("unknown_error");
      alert(`${t("homepage_error_creating_project")}: ${msg}`);
      throw err; // إعادة throw للسماح لـ SitePlanStep بمعالجة الخطأ
    } finally {
      setIsCreatingProject(false);
    }
  };

  // ✅ تحديد المراحل المكتملة
  const isStepCompleted = (stepId) => {
    if (isNewProject) {
      // للمشروع الجديد، نستخدم البيانات المؤقتة
      switch (stepId) {
        case "setup":
          return setupHasAllSelections();
        case "siteplan":
          return false;
        default:
          return false;
      }
    }
    
    // للمشروع الموجود، نستخدم البيانات من DB
    switch (stepId) {
      case "setup":
        return setupHasAllSelections();
      case "siteplan":
        return !!siteplan && siteplan.id;  // ✅ التحقق من وجود id
      case "license":
        return !!license && license.id;  // ✅ التحقق من وجود id
      case "contract":
        return !!contractData && contractData.id;  // ✅ التحقق من وجود id
      case "award":
        return !!awarding && awarding.id;  // ✅ التحقق من وجود id
      default:
        return false;
    }
  };

  const Current = STEPS[index].Component;

  // ✅ إظهار loading overlay أثناء إنشاء المشروع
  if (isCreatingProject) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "var(--fs-24)", marginBottom: "var(--space-4)" }}>
            {isAR ? "جاري إنشاء المشروع..." : "Creating project..."}
          </div>
          <div style={{ color: "var(--muted)" }}>
            {isAR ? "يرجى الانتظار..." : "Please wait..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="row row--space-between row--align-center">
          <div className="mini">
            {isNewProject 
              ? (isAR ? "مشروع جديد" : "New Project")
              : (project?.name ? `${labels.projectPrefix}: ${project.name}` : null)}
          </div>
          {!isNewProject && projectId && (
            <Button as={Link} variant="secondary" to={`/projects/${projectId}`}>
              {labels.projectPrefix} ←
            </Button>
          )}
          {isNewProject && (
            <Button as={Link} variant="secondary" to="/projects">
              {labels.home} ←
            </Button>
          )}
        </div>

        {/* Stepper */}
        <div className="stepper numbered mt-8">
          {STEPS.map(({ id, title }, i) => {
            const locked = !canEnter(i);
            const active = index === i;
            const completed = isStepCompleted(id);
            return (
              <button
                key={id}
                type="button"
                className={`step ${active ? "active" : ""} ${locked ? "disabled" : ""} ${completed ? "completed" : ""}`}
                onClick={() => onStepClick(i)}
                disabled={locked}
              >
                <span className="step-dot">
                  {completed ? <FaCheck className="step-check" /> : i + 1}
                </span>
                {title}
              </button>
            );
          })}
        </div>

        {/* Info */}
        {index === 0 && (
          <div className="row row--align-center row--gap-8 mt-8">
            <InfoTip wide align="start" text={labels.infoNote} />
            <span className="mini">{t("wizard_info_click")}</span>
          </div>
        )}

        {/* Summary */}
        <div className="mt-12">
          <SetupSummary setup={setup} />
        </div>
      </div>

      {/* الخطوات */}
      {index === 0 && (
        <Current
          value={setup}
          onChange={setSetup}
          onNext={() => {
            if (!isView && allowSitePlanFlow && setupHasAllSelections()) goNext();
          }}
          isView={isView}
          isNewProject={isNewProject}
        />
      )}

      {allowSitePlanFlow && index === 1 && (
        <Current 
          projectId={isNewProject ? null : projectId} 
          setup={setup} 
          onPrev={goPrev} 
          onNext={isNewProject ? undefined : goNext}
          isView={isView}
          isNewProject={isNewProject}
          onCreateProject={(sitePlanData) => {
            createProjectAndSaveData(setup, sitePlanData);
          }}
        />
      )}
      {allowSitePlanFlow && index === 2 && (
        <Current projectId={projectId} onPrev={goPrev} onNext={goNext} isView={isView} />
      )}
      {allowSitePlanFlow && index === 3 && (
        <Current 
          projectId={projectId} 
          onPrev={goPrev} 
          // ✅ نمرر onNext إذا كانت هناك خطوة تالية (AwardingStep موجودة)
          // ContractStep سيتحقق داخلياً من نوع العقد (housing_loan_program) ليقرر ما إذا كان يجب الانتقال للخطوة التالية
          onNext={STEPS.some(s => s.id === "award") ? goNext : undefined}
          isView={isView} 
        />
      )}
      {allowSitePlanFlow && index === 4 && (
        <Current projectId={projectId} onPrev={goPrev} isView={isView} />
      )}
    </div>
  );
}
