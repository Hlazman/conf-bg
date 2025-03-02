import React, { createContext, useState, useEffect } from "react";
import languageMap from "../languages/language";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem("appLanguage") || "en");

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations: languageMap[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};
