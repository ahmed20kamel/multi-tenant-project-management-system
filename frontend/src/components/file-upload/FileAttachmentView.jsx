import { useTranslation } from "react-i18next";
import { FaEye, FaDownload } from "react-icons/fa";
import Button from "../common/Button";
import { api } from "../../services/api";

export default function FileAttachmentView({ fileUrl, fileName, projectId, endpoint }) {
  const { t } = useTranslation();

  if (!fileUrl && !fileName) {
    return <div style={{ color: "#999", fontStyle: "italic" }}>{t("no_file_attached")}</div>;
  }

  // استخراج اسم الملف وفك ترميز URL
  const getDisplayName = () => {
    if (fileName) {
      try {
        // محاولة فك ترميز URL إذا كان الاسم مرمز
        return decodeURIComponent(fileName);
      } catch {
        return fileName;
      }
    }
    if (fileUrl) {
      try {
        const urlParts = fileUrl.split("/");
        const lastPart = urlParts[urlParts.length - 1] || "";
        // فك ترميز URL
        return decodeURIComponent(lastPart);
      } catch {
        const urlParts = fileUrl.split("/");
        return urlParts[urlParts.length - 1] || t("file");
      }
    }
    return t("file");
  };

  const displayName = getDisplayName();

  const handleView = () => {
    if (!fileUrl) return;
    
    // بناء URL كامل للملف
    let fullUrl = fileUrl;
    if (!fileUrl.startsWith("http")) {
      // ✅ إذا كان URL نسبي يبدأ بـ /media/، نستخدمه مباشرة
      // ملفات الـ media موجودة في /media/ وليس /api/media/
      if (fileUrl.startsWith("/media/")) {
        // في development، قد نحتاج لإضافة base URL
        const isDev = import.meta.env.DEV;
        const ROOT = isDev ? "" : (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
        fullUrl = `${ROOT}${fileUrl}`;
      } else if (fileUrl.startsWith("/")) {
        // URLs أخرى نسبية
        const baseURL = api.defaults.baseURL || "";
        fullUrl = baseURL.endsWith("/") && fileUrl.startsWith("/")
          ? `${baseURL.slice(0, -1)}${fileUrl}`
          : `${baseURL}${fileUrl}`;
      } else {
        // URL نسبي بدون /
        const baseURL = api.defaults.baseURL || "";
        fullUrl = `${baseURL}${fileUrl}`;
      }
    }
    
    // فتح الملف في نافذة جديدة
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    if (!fileUrl) return;

    try {
      // ✅ بناء URL للتحميل - نفس منطق handleView
      let downloadUrl = fileUrl;
      if (!fileUrl.startsWith("http")) {
        // ✅ إذا كان URL نسبي يبدأ بـ /media/، نستخدمه مباشرة
        if (fileUrl.startsWith("/media/")) {
          const isDev = import.meta.env.DEV;
          const ROOT = isDev ? "" : (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
          downloadUrl = `${ROOT}${fileUrl}`;
        } else if (fileUrl.startsWith("/")) {
          const baseURL = api.defaults.baseURL || "";
          downloadUrl = baseURL.endsWith("/") && fileUrl.startsWith("/")
            ? `${baseURL.slice(0, -1)}${fileUrl}`
            : `${baseURL}${fileUrl}`;
        } else {
          const baseURL = api.defaults.baseURL || "";
          downloadUrl = `${baseURL}${fileUrl}`;
        }
      }

      // إنشاء رابط تحميل
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = displayName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: فتح في نافذة جديدة
      handleView();
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "12px",
      padding: "12px",
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "8px"
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontWeight: 500, 
          color: "var(--ink)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: "14px"
        }} title={displayName}>
          {displayName}
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <Button
          variant="secondary"
          onClick={handleView}
          disabled={!fileUrl}
          style={{ minWidth: "auto", padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          title={t("view_file")}
        >
          <FaEye />
          <span>{t("view")}</span>
        </Button>
        <Button
          variant="primary"
          onClick={handleDownload}
          disabled={!fileUrl}
          style={{ minWidth: "auto", padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          title={t("download_file")}
        >
          <FaDownload />
          <span>{t("download")}</span>
        </Button>
      </div>
    </div>
  );
}

