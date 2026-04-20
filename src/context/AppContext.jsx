import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const translations = {
  ar: {
    brand: "بوابة الموجه",
    tab_info: "المعلومات",
    tab_feedbacks: "التقارير",
    signin_title: "تسجيل الدخول",
    signin_tag: "الوصول إلى الشركات المخصصة لك",
    label_round: "اختر الدورة",
    label_mentor: "اختر اسم الموجه",
    label_pin: "رمز الدخول (إن وجد)",
    btn_signin: "تسجيل الدخول",
    select_round_first: "اختر الدورة أولاً",
    loading: "جاري التحميل...",
    btn_refresh: "تحديث",
    btn_logout: "خروج",
    label_company: "الشركة",
    label_start_date: "تاريخ البدء",
    label_stage: "المرحلة",
    label_traction: "النمو",
    label_revenue: "الإيرادات السنوية",
    btn_create_feedback: "إنشاء تقرير",
    label_filter_company: "تصفية حسب الشركة",
    label_filter: "تصفية",
    btn_all: "الكل",
    btn_minded: "المخصصة لي",
    modal_feedback_title: "إنشاء تقرير جديد",
    label_mentor_name: "اسم الموجه",
    label_round_f: "الدورة",
    label_company_name: "اسم الشركة",
    placeholder_company: "ابحث واختر الشركة...",
    label_day: "يوم الجلسة",
    select_day: "اختر اليوم",
    label_status: "الوضع الحالي",
    placeholder_desc: "أدخل الوصف...",
    label_achievements: "الإنجازات منذ الجلسة الأخيرة",
    placeholder_achievements: "أدخل الإنجازات...",
    label_action_steps: "خطوات العمل القادمة",
    placeholder_next_steps: "أدخل الخطوات القادمة...",
    label_mentor_score: "تقييم الموجه (0 - 5)",
    label_prod_score: "تقييم المنتج",
    label_ops_score: "تقييم العمليات",
    label_sales_score: "تقييم المبيعات",
    label_mkt_score: "تقييم التسويق",
    label_fin_score: "تقييم الماليات",
    btn_cancel: "إلغاء",
    btn_submit: "إرسال التقرير",
    modal_session_title: "تفاصيل الجلسة",
    btn_save_changes: "حفظ التعديلات"
  },
  en: {
    brand: "Mentor Portal",
    tab_info: "Information",
    tab_feedbacks: "Feedbacks",
    signin_title: "Sign In",
    signin_tag: "Access your assigned companies",
    label_round: "Select Round",
    label_mentor: "Select Mentor Name",
    label_pin: "PIN Code (If applicable)",
    btn_signin: "Sign In",
    select_round_first: "Select round first",
    loading: "Loading...",
    btn_refresh: "Refresh",
    btn_logout: "Logout",
    label_company: "Company",
    label_start_date: "Start Date",
    label_stage: "Stage",
    label_traction: "Traction",
    label_revenue: "Annual Revenue",
    btn_create_feedback: "Create Feedback",
    label_filter_company: "Filter by Company",
    label_filter: "Filter",
    btn_all: "All",
    btn_minded: "Minded",
    modal_feedback_title: "Create New Feedback",
    label_mentor_name: "Mentor Name",
    label_round_f: "Round",
    label_company_name: "Company Name",
    placeholder_company: "Search and select company...",
    label_day: "Day Of Session",
    select_day: "Select Day",
    label_status: "Current Status",
    placeholder_desc: "Enter description...",
    label_achievements: "Achievements",
    placeholder_achievements: "Enter achievements...",
    label_action_steps: "Action Steps",
    placeholder_next_steps: "Enter next steps...",
    label_mentor_score: "Mentor Score (0 - 5)",
    label_prod_score: "Product Evaluation",
    label_ops_score: "Operations Evaluation",
    label_sales_score: "Sales Evaluation",
    label_mkt_score: "Marketing Evaluation",
    label_fin_score: "Finance Evaluation",
    btn_cancel: "Cancel",
    btn_submit: "Submit Feedback",
    modal_session_title: "Session Details",
    btn_save_changes: "Save Changes"
  }
};

const safeStorage = {
  get: (key, fallback) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      console.warn("Storage access blocked:", e);
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write blocked:", e);
    }
  }
};

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => safeStorage.get('mentor_lang', 'ar'));
  const [theme, setTheme] = useState(() => safeStorage.get('mentor_theme', 'light'));
  const [user, setUser] = useState(null);
  const [currentRound, setCurrentRound] = useState(() => safeStorage.get('mentor_round', ''));

  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      safeStorage.set('mentor_lang', lang);
    } catch (e) {}
  }, [lang]);

  useEffect(() => {
    try {
      document.body.setAttribute('data-theme', theme);
      safeStorage.set('mentor_theme', theme);
    } catch (e) {}
  }, [theme]);

  const t = (key) => translations[lang][key] || key;

  return (
    <AppContext.Provider value={{
      lang, setLang,
      theme, setTheme,
      user, setUser,
      currentRound, setCurrentRound,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
