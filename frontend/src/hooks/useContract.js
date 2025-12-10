// Hook موحد لإدارة بيانات العقد
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { toInputDate, toIsoDate, todayIso } from "../utils/formatters";
import { toYesNo } from "../utils/helpers";

const INITIAL_FORM = {
  contract_classification: "",
  contract_type: "",
  tender_no: "",
  contract_date: "",
  owners: [],
  contractor_name: "",
  contractor_name_en: "",
  contractor_trade_license: "",
  contractor_phone: "",
  contractor_email: "",
  total_project_value: "",
  total_bank_value: "",
  total_owner_value: "",
  project_duration_months: "",
  owner_includes_consultant: "no",
  owner_fee_design_percent: "",
  owner_fee_supervision_percent: "",
  owner_fee_extra_mode: "percent",
  owner_fee_extra_value: "",
  bank_includes_consultant: "no",
  bank_fee_design_percent: "",
  bank_fee_supervision_percent: "",
  bank_fee_extra_mode: "percent",
  bank_fee_extra_value: "",
  has_start_order: "no",
  start_order_file: null,
  start_order_date: "",
  project_end_date: "",
  contract_file: null,
  contract_appendix_file: null,
  contract_explanation_file: null,
  general_notes: "",
  attachments: [], // المرفقات الديناميكية
  extensions: [], // التمديدات: [{reason: string, days: number, months: number}, ...]
  // ✅ مرفقات العقد الثابتة
  quantities_table_file: null,
  approved_materials_table_file: null,
  price_offer_file: null,
  contractual_drawings_file: null,
  general_specifications_file: null,
};

export default function useContract(projectId) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [existingId, setExistingId] = useState(null);
  const [isView, setIsView] = useState(false);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // قراءة عقد موجود
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/contract/`);
        if (Array.isArray(data) && data.length) {
          const s = data[0];
          setExistingId(s.id);
          setForm((prev) => ({
            ...prev,
            ...s,
            contract_date: toInputDate(s.contract_date) || prev.contract_date || todayIso(),
            owner_includes_consultant: toYesNo(s.owner_includes_consultant),
            bank_includes_consultant: toYesNo(s.bank_includes_consultant),
            // ✅ تحويل start_order_exists (boolean) إلى has_start_order (yes/no)
            has_start_order: toYesNo(s.start_order_exists),
            // الحفاظ على start_order_file كـ null (سيتم تحميله في ContractStep)
            start_order_file: null,
            // ✅ تحميل التمديدات
            extensions: Array.isArray(s.extensions) ? s.extensions : [],
            // ✅ تحميل owners من العقد (إذا كانت موجودة)
            owners: Array.isArray(s.owners) && s.owners.length > 0 ? s.owners : prev.owners || [],
          }));
          // لا نضع setIsView(true) تلقائياً - سيبقى في وضع edit حتى يختار المستخدم view
        }
      } catch {}
    })();
  }, [projectId]);

  // جلب بيانات الملاك والمقاول
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const [spRes, lcRes] = await Promise.allSettled([
          api.get(`projects/${projectId}/siteplan/`),
          api.get(`projects/${projectId}/license/`),
        ]);

        // ✅ تحميل owners من العقد أولاً (إذا كانت موجودة)، وإلا من SitePlan
        if (spRes.status === "fulfilled" && Array.isArray(spRes.value?.data) && spRes.value.data.length) {
          const sp = spRes.value.data[0];
          const ownersArr = Array.isArray(sp.owners) ? sp.owners : [];
          setForm((prev) => {
            // ✅ إذا كان owners موجود في العقد، نستخدمه، وإلا نستخدم owners من SitePlan
            if (prev.owners?.length) {
              return prev; // لا نغير owners إذا كانت موجودة من العقد
            }
            return {
              ...prev,
              owners: ownersArr.map((o) => ({ ...o })),
            };
          });
        }

        if (lcRes.status === "fulfilled" && Array.isArray(lcRes.value?.data) && lcRes.value.data.length) {
          const lc = lcRes.value.data[0];
          setForm((prev) => ({
            ...prev,
            // ✅ جلب بيانات المقاول من الرخصة (إذا لم تكن موجودة في العقد)
            contractor_name: prev.contractor_name || lc.contractor_name || "",
            contractor_name_en: prev.contractor_name_en || lc.contractor_name_en || "",
            contractor_trade_license: prev.contractor_trade_license || lc.contractor_license_no || "",
            contractor_phone: prev.contractor_phone || lc.contractor_phone || "",
            contractor_email: prev.contractor_email || lc.contractor_email || "",
          }));
        }
      } catch {}
    })();
  }, [projectId]);

  // ملء تاريخ اليوم تلقائيًا
  useEffect(() => {
    if (!form.contract_date) setForm((p) => ({ ...p, contract_date: todayIso() }));
  }, [form.contract_date]);

  return { form, setForm, setF, existingId, setExistingId, isView, setIsView };
}

