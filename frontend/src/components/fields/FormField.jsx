// مكون Form Field محترف موحد
import { useId } from "react";
import { useTranslation } from "react-i18next";

export default function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  className = "",
  ...props
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const fieldId = useId();

  return (
    <div
      className={`form-field ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "100%"
      }}
    >
      {label && (
        <label
          htmlFor={fieldId}
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}
        >
          {label}
          {required && (
            <span style={{ color: "var(--error-500)" }} aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {children ? (
        <div style={{ width: "100%" }}>
          {typeof children === "function" ? children(fieldId) : children}
        </div>
      ) : (
        <input
          id={fieldId}
          className="form-input"
          {...props}
        />
      )}

      {hint && !error && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-tertiary)",
            marginTop: "-0.25rem"
          }}
        >
          {hint}
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--error-500)",
            marginTop: "-0.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

