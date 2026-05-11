import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

type Language = 'en' | 'zh';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    app_title: "Who Will Pay",
    subtitle: "Online Shopper Purchase Intention Prediction Platform",
    execute: "Execute Inference",
    loading_python: "Loading Python environment...",
    loading_packages: "Installing pandas and scikit-learn...",
    training_model: "Training Random Forest model...",
    dataset_insights: "Dataset Insights",
    feature_significance: "Feature Significance",
    model_inputs: "Model Inputs",
    prediction_outcome: "Prediction Outcome",
    potential_revenue: "Potential Revenue",
    inert_session: "Inert Session",
    returning_visitor: "Returning Visitor",
    new_visitor: "New Visitor",
    accuracy: "Accuracy",
    confidence: "Confidence Consensus",
    login_with_google: "Login with Google",
    dashboard: "Dashboard",
    history: "Prediction History",
    logout: "Logout",
    standby: "STANDBY",
    pipeline_ready: "Pipeline Ready",
    source: "Source",
    window: "Window",
    timescale: "Timescale",
    weekday: "Weekday",
    weekend: "Weekend"
  },
  zh: {
    app_title: "谁会买单",
    subtitle: "在线购物者购买意愿预测平台",
    execute: "执行推理",
    loading_python: "正在初始化 Python 环境...",
    loading_packages: "正在安装 pandas 和 scikit-learn (请稍候)...",
    training_model: "正在训练随机森林模型...",
    dataset_insights: "数据集洞察",
    feature_significance: "特征显著性",
    model_inputs: "模型输入",
    prediction_outcome: "预测结果",
    potential_revenue: "潜在收入",
    inert_session: "非活跃会话",
    returning_visitor: "回访者",
    new_visitor: "新访客",
    accuracy: "准确率",
    confidence: "置信度共识",
    login_with_google: "使用 Google 登录",
    dashboard: "仪表盘",
    history: "预测历史",
    logout: "登出",
    standby: "待命",
    pipeline_ready: "流水线就绪",
    source: "来源",
    window: "时间窗口",
    timescale: "时间跨度",
    weekday: "工作日",
    weekend: "周末"
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Language is handled locally for now to ensure app reliability
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
