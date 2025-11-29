// مكون موحد لقسم أتعاب الاستشاري
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Field from "../../../components/fields/Field";
import ViewRow from "../../../components/fields/ViewRow";
import RtlSelect from "../../../components/fields/RtlSelect";
import NumberField from "../../../components/fields/NumberField";
import YesNoChips from "../../../components/YesNoChips";

export default function ConsultantFeesSection({
  prefix, // "owner" أو "bank"
  form,
  setF,
  isView,
  isAR,
}) {
  const { t } = useTranslation();
  
  const EXTRA_FEE_MODE = useMemo(
    () => [
      { value: "percent", label: t("contract.fees.mode.percent") },
      { value: "fixed", label: t("contract.fees.mode.fixed") },
      { value: "other", label: t("contract.fees.mode.other") },
    ],
    [t]
  );

  const includesConsultant = form[`${prefix}_includes_consultant`];
  const showFees = includesConsultant === "yes";

  if (isView) {
    return (
      <div className="form-grid cols-1" style={{ gap: "var(--space-4)" }}>
        <ViewRow
          label={t("contract.fees.include_consultant")}
          value={includesConsultant === "yes" ? t("yes") : t("no")}
        />
        {showFees && (
          <>
            <div className="form-grid cols-2" style={{ gap: "var(--space-4)" }}>
              <ViewRow
                label={t("contract.fees.design_percent")}
                value={form[`${prefix}_fee_design_percent`] || "0.00"}
              />
              <ViewRow
                label={t("contract.fees.supervision_percent")}
                value={form[`${prefix}_fee_supervision_percent`] || "0.00"}
              />
            </div>
            <ViewRow
              label={t("contract.fees.extra_type")}
              value={EXTRA_FEE_MODE.find(m => m.value === form[`${prefix}_fee_extra_mode`])?.label || form[`${prefix}_fee_extra_mode`]}
            />
            <ViewRow
              label={t("contract.fees.extra_value")}
              value={form[`${prefix}_fee_extra_value`] || "0.00"}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="form-grid cols-1" style={{ gap: "var(--space-4)" }}>
      <Field label={t("contract.fees.include_consultant")}>
        <YesNoChips
          value={includesConsultant}
          onChange={(v) => setF(`${prefix}_includes_consultant`, v)}
        />
      </Field>

      {showFees && (
        <>
          <div className="form-grid cols-2" style={{ gap: "var(--space-4)" }}>
            <Field label={t("contract.fees.design_percent")}>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form[`${prefix}_fee_design_percent`] || ""}
                onChange={(e) => setF(`${prefix}_fee_design_percent`, e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label={t("contract.fees.supervision_percent")}>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form[`${prefix}_fee_supervision_percent`] || ""}
                onChange={(e) => setF(`${prefix}_fee_supervision_percent`, e.target.value)}
                placeholder="0.00"
              />
            </Field>
          </div>
          <Field label={t("contract.fees.extra_type")}>
            <RtlSelect
              className="rtl-select"
              dir={isAR ? "rtl" : "ltr"}
              options={EXTRA_FEE_MODE}
              value={form[`${prefix}_fee_extra_mode`]}
              onChange={(v) => setF(`${prefix}_fee_extra_mode`, v)}
            />
          </Field>
          <Field label={t("contract.fees.extra_value")}>
            <NumberField
              value={form[`${prefix}_fee_extra_value`]}
              onChange={(v) => setF(`${prefix}_fee_extra_value`, v)}
            />
          </Field>
        </>
      )}
    </div>
  );
}

