import React, { useContext, useState } from "react";
import { Button } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import { LanguageContext } from "../context/LanguageContext";
import InformationPresentationShort from "../shortPresentation/InformationPresentationShort";
import CompanyInformationPresentation from "../presentation/CompanyInformationPresentation";

const ShortPresentation = ({ orderData, companyData }) => {
  const { translations } = useContext(LanguageContext);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Функция для сохранения в PDF
  const saveToPDF = () => {
    const element = document.getElementById('client-presentation-content');
    const options = {
      // margin: 10,
      margin: [3, 10, 3, 10],
      filename: `Order_Presentation_${orderData.orderNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      // pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      pagebreak: { 
        mode: ['css', 'legacy'],
        avoid: ['table', 'tbody', 'tr', 'th', 'img', '.ant-divider', '.ant-descriptions',] 
      }
    };
    // Устанавливаем флаг генерации PDF
    setGeneratingPdf(true);

    setTimeout(() => {
      html2pdf().set(options).from(element).save();
    }, 1000);
  };


  const subordersWithError = orderData.suborders
  .filter(sub => {
    const errors = sub.suborderErrors || {};
    return Object.values(errors).some(val => val === true);
  });

  return (
    <div className="client-presentation">
      <div className="presentation-header">
        <Button type="primary" onClick={saveToPDF}>
          {translations.saveToPDF || "Save to PDF"}
        </Button>

        <p style={{marginTop: 15}}> <WarningOutlined style={{ color: "#fecf6d" }} /> {translations.chooseManager}</p>

        {subordersWithError.map(sub => (
          <div key={sub.documentId} style={{ marginTop: '15px', color: 'red', fontWeight: 'bold' }}>
            {translations[sub?.suborder_type?.typeName]} : {translations.err}
          </div>
        ))}
      </div>
      
      <div id="client-presentation-content" className="presentation-content">
        <InformationPresentationShort order={orderData} isPdf={generatingPdf} />
        <CompanyInformationPresentation 
          companyData={companyData} 
          translations={translations} 
          isPdf={generatingPdf}
          orderData={orderData}
        />
      </div>
    </div>
  );
};

export default ShortPresentation;

