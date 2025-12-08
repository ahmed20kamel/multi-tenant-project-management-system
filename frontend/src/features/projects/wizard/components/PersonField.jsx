// مكون موحد لحقل الاستشاري أو المقاول مع البحث
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Field from "../../../../components/forms/Field";
import ViewRow from "../../../../components/forms/ViewRow";
import { loadSavedList, saveToList } from "../../../../utils/localStorage";
import { formatUAEPhone } from "../../../../utils/inputFormatters";

export default function PersonField({
  type = "consultant", // "consultant" or "contractor"
  label,
  licenseLabel,
  nameValue,
  nameEnValue,
  licenseValue,
  phoneValue,
  emailValue,
  onNameChange,
  onNameEnChange,
  onLicenseChange,
  onPhoneChange,
  onEmailChange,
  isView,
  onSelect,
}) {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const storageKey = type === "consultant" ? "consultants" : "contractors";
  const [savedList, setSavedList] = useState(() => loadSavedList(storageKey));

  const namePlaceholder = type === "consultant" 
    ? t("consultant_name_placeholder")
    : t("contractor_name_placeholder");
  const licensePlaceholder = type === "consultant"
    ? t("consultant_license_placeholder")
    : t("contractor_license_placeholder");
  const notFoundText = type === "consultant"
    ? t("consultant_not_found", { defaultValue: "" })
    : t("contractor_not_found");

  if (isView) {
    // ✅ للمقاول: استخدام grid 2 columns في viewMode أيضاً
    if (type === "contractor") {
      return (
        <div className="form-grid cols-2" style={{ gap: "var(--space-4)", width: "100%" }}>
          <ViewRow label="الاسم (عربي)" value={nameValue} />
          <ViewRow label="الاسم (English)" value={nameEnValue} />
          <ViewRow label={licenseLabel} value={licenseValue} />
          <ViewRow label="الهاتف" value={phoneValue || ""} />
          <ViewRow label="البريد الإلكتروني" value={emailValue || ""} />
          <div></div>
        </div>
      );
    }
    // ✅ للاستشاري: استخدام grid 2 columns في viewMode أيضاً
    return (
      <div className="form-grid cols-2" style={{ gap: "var(--space-4)", width: "100%" }}>
        <ViewRow label="الاسم (عربي)" value={nameValue} />
        <ViewRow label="الاسم (English)" value={nameEnValue} />
        <ViewRow label={licenseLabel} value={licenseValue} />
        <div></div>
      </div>
    );
  }

  // ✅ تحسين البحث - البحث في أي جزء من الاسم
  const filteredList = useMemo(() => {
    if (!nameValue) return savedList;
    const searchTerm = nameValue.toLowerCase();
    return savedList.filter((c) =>
      c.name.toLowerCase().includes(searchTerm) ||
      (c.license && c.license.toLowerCase().includes(searchTerm))
    );
  }, [savedList, nameValue]);

  // ✅ إضافة استشاري جديد إذا لم يكن موجوداً
  const handleAddNew = () => {
    if (!nameValue || !licenseValue) return;
    
    // ✅ حفظ الاستشاري مع name_en
    const newItem = { 
      name: nameValue, 
      license: licenseValue,
      name_en: nameEnValue || "",
      ...(type === "contractor" && {
        phone: phoneValue || "",
        email: emailValue || ""
      })
    };
    saveToList(storageKey, newItem);
    setSavedList(loadSavedList(storageKey)); // ✅ إعادة تحميل القائمة المحدثة
  };

  // ✅ حفظ name_en تلقائياً عند تغييره
  const handleNameEnChange = (value) => {
    if (onNameEnChange) {
      onNameEnChange(value);
    }
    
    // ✅ إذا كان هناك name و license، نحفظ name_en تلقائياً
    if (nameValue && licenseValue && value) {
      const existingItem = savedList.find(
        c => c.name === nameValue && c.license === licenseValue
      );
      
      if (existingItem) {
        // ✅ تحديث name_en للاستشاري/المقاول الموجود
        saveToList(storageKey, {
          ...existingItem,
          name_en: value
        });
        setSavedList(loadSavedList(storageKey));
      }
    }
  };

  // ✅ حفظ phone تلقائياً عند تغييره (للمقاول فقط)
  const handlePhoneChange = (value) => {
    if (onPhoneChange) {
      onPhoneChange(value);
    }
    
    // ✅ إذا كان هناك name و license، نحفظ phone تلقائياً
    if (type === "contractor" && nameValue && licenseValue && value) {
      const existingItem = savedList.find(
        c => c.name === nameValue && c.license === licenseValue
      );
      
      if (existingItem) {
        // ✅ تحديث phone للمقاول الموجود
        saveToList(storageKey, {
          ...existingItem,
          phone: value
        });
        setSavedList(loadSavedList(storageKey));
      }
    }
  };

  // ✅ حفظ email تلقائياً عند تغييره (للمقاول فقط)
  const handleEmailChange = (value) => {
    if (onEmailChange) {
      onEmailChange(value);
    }
    
    // ✅ إذا كان هناك name و license، نحفظ email تلقائياً
    if (type === "contractor" && nameValue && licenseValue && value) {
      const existingItem = savedList.find(
        c => c.name === nameValue && c.license === licenseValue
      );
      
      if (existingItem) {
        // ✅ تحديث email للمقاول الموجود
        saveToList(storageKey, {
          ...existingItem,
          email: value
        });
        setSavedList(loadSavedList(storageKey));
      }
    }
  };

  // ✅ تحميل بيانات المقاول تلقائياً عند تغيير الرخصة أو الاسم
  const handleLicenseChange = (value) => {
    if (onLicenseChange) {
      onLicenseChange(value);
    }
    
    // ✅ إذا كان مقاول وتم إدخال name و license، نحاول تحميل البيانات المحفوظة
    if (type === "contractor" && nameValue && value) {
      const existingItem = savedList.find(
        c => c.name === nameValue && c.license === value
      );
      
      if (existingItem) {
        // ✅ تحميل البيانات المحفوظة تلقائياً
        if (existingItem.name_en && onNameEnChange) {
          onNameEnChange(existingItem.name_en);
        }
        if (existingItem.phone && onPhoneChange) {
          onPhoneChange(existingItem.phone);
        }
        if (existingItem.email && onEmailChange) {
          onEmailChange(existingItem.email);
        }
      }
    }
  };

  // ✅ تحميل بيانات المقاول تلقائياً عند تغيير الاسم
  const handleNameChange = (value) => {
    if (onNameChange) {
      onNameChange(value);
    }
    setShowSuggestions(true);
    
    // ✅ إذا كان مقاول وتم إدخال name و license، نحاول تحميل البيانات المحفوظة
    if (type === "contractor" && value && licenseValue) {
      const existingItem = savedList.find(
        c => c.name === value && c.license === licenseValue
      );
      
      if (existingItem) {
        // ✅ تحميل البيانات المحفوظة تلقائياً
        if (existingItem.name_en && onNameEnChange) {
          onNameEnChange(existingItem.name_en);
        }
        if (existingItem.phone && onPhoneChange) {
          onPhoneChange(existingItem.phone);
        }
        if (existingItem.email && onEmailChange) {
          onEmailChange(existingItem.email);
        }
      }
    }
  };

  // ✅ للمقاول: استخدام grid 2 columns
  if (type === "contractor") {
  return (
      <div className="form-grid cols-2" style={{ gap: "var(--space-4)", width: "100%" }}>
        <Field label="الاسم (عربي)">
        <div className="pos-relative">
          <input
            className="input"
            placeholder={namePlaceholder}
            value={nameValue || ""}
            onChange={(e) => {
              handleNameChange(e.target.value);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && nameValue && (
            <div className="dropdown-list">
              {filteredList.length > 0 ? (
                filteredList.map((c, i) => (
                  <div
                    key={i}
                    className="dropdown-item"
                    onMouseDown={() => {
                        handleNameChange(c.name || "");
                        onNameEnChange && onNameEnChange(c.name_en || "");
                        handleLicenseChange(c.license || "");
                        onPhoneChange && onPhoneChange(c.phone || "");
                        onEmailChange && onEmailChange(c.email || "");
                      if (onSelect) onSelect(c);
                    }}
                  >
                    {c.name}
                  </div>
                ))
              ) : (
                notFoundText && (
                  <div className="dropdown-item opacity-70">
                    {notFoundText}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </Field>
        <Field label="الاسم (English)">
          <input
            className="input"
            placeholder="Enter name in English"
            value={nameEnValue || ""}
            onChange={(e) => {
              handleNameEnChange(e.target.value);
            }}
          />
        </Field>
      <Field label={licenseLabel}>
        <input
          className="input"
          placeholder={licensePlaceholder}
          value={licenseValue || ""}
            onChange={(e) => {
              handleLicenseChange(e.target.value);
            }}
          />
        </Field>
        <Field label="الهاتف">
          <input
            className="input"
            type="tel"
            placeholder="+971XXXXXXXXX"
            value={phoneValue || ""}
            onChange={(e) => {
              const formatted = formatUAEPhone(e.target.value);
              handlePhoneChange(formatted);
            }}
          />
        </Field>
        <Field label="البريد الإلكتروني">
          <input
            className="input"
            type="email"
            placeholder="example@email.com"
            value={emailValue || ""}
            onChange={(e) => {
              handleEmailChange(e.target.value);
            }}
          />
        </Field>
        <div></div>
      </div>
    );
  }

  // ✅ للاستشاري: استخدام grid 2 columns - الاسم العربي والإنجليزي في نفس السطر
  return (
    <>
      {/* ✅ السطر الأول: الاسم العربي والإنجليزي جنب بعض */}
      <div className="form-grid cols-2" style={{ gap: "var(--space-4)", width: "100%", marginBottom: "var(--space-4)" }}>
        <Field label="الاسم (عربي)">
          <div className="pos-relative">
            <input
              className="input"
              placeholder={namePlaceholder}
              value={nameValue || ""}
              onChange={(e) => {
                const v = e.target.value;
                onNameChange(v);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && nameValue && (
              <div className="dropdown-list">
                {filteredList.length > 0 ? (
                  filteredList.map((c, i) => (
                    <div
                      key={i}
                      className="dropdown-item"
                      onMouseDown={() => {
                        onNameChange(c.name || "");
                        onNameEnChange && onNameEnChange(c.name_en || "");
                        onLicenseChange(c.license || "");
                        if (onSelect) onSelect(c);
                      }}
                    >
                      {c.name}
                    </div>
                  ))
                ) : (
                  notFoundText && (
                    <div className="dropdown-item opacity-70">
                      {notFoundText}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </Field>
        <Field label="الاسم (English)">
          <input
            className="input"
            placeholder="Enter name in English"
            value={nameEnValue || ""}
            onChange={(e) => {
              handleNameEnChange(e.target.value);
            }}
          />
        </Field>
      </div>
      
      {/* ✅ السطر الثاني: الرخصة */}
      <div style={{ width: "100%" }}>
        <Field label={licenseLabel}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              className="input"
              placeholder={licensePlaceholder}
              value={licenseValue || ""}
              onChange={(e) => {
                let value = e.target.value;
                // ✅ إذا كان استشاري، نضيف CN- تلقائياً
                if (type === "consultant" && value && !value.startsWith("CN-")) {
                  // إزالة CN- إذا كان موجوداً مسبقاً
                  value = value.replace(/^CN-/, "");
                  value = "CN-" + value;
                }
                onLicenseChange(value);
              }}
              style={type === "consultant" ? { textTransform: "uppercase" } : {}}
            />
            {type === "consultant" && nameValue && licenseValue && !filteredList.some(c => c.name === nameValue && c.license === licenseValue) && (
              <button
                type="button"
                onClick={handleAddNew}
                style={{
                  padding: "8px 12px",
                  background: "#f97316",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => e.target.style.background = "#ea580c"}
                onMouseLeave={(e) => e.target.style.background = "#f97316"}
                title={t("add_new_consultant") || "إضافة استشاري جديد"}
              >
                {t("add") || "+"}
              </button>
            )}
          </div>
        </Field>
      </div>
    </>
  );
}

