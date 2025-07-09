import React, { useContext, useState } from "react";
import { Button } from "antd";
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import { LanguageContext } from "../context/LanguageContext";
import DoorFactory from "../Factory/DoorFactory";
import SkirtingFactory from "../Factory/SkirtingFactory";
import SamplesFactory from "../Factory/SamplesFactory";
import WallPanelsFactory from "../Factory/WallPanelsFactory";
import DecorFactory from "../Factory/DecorFactory";
import ElementsFactory from "../Factory/ElementsFactory";
import FrameFactory from "../Factory/FrameFactory";
import HardwareFactory from "../Factory/HardwareFactory";
import OptionsFactory from "../Factory/OptionsFactory";
import TotalPriceFactory from "../Factory/TotalPriceFactory";


const FactoryPresentation = ({ orderData }) => {
  const { translations } = useContext(LanguageContext);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Функция для сохранения в PDF
  const saveToPDF = () => {
    const element = document.getElementById('factory-presentation-content');
    const options = {
      margin: 10,
      filename: `Factory_${orderData.orderNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Устанавливаем флаг генерации PDF
    setGeneratingPdf(true);

    // html2pdf().set(options).from(element).save();
    
    setTimeout(() => {
      html2pdf().set(options).from(element).save();
    }, 1000);
  };

  const sortSuborders = (suborders) => {
    const typeOrder = ['door', 'hiddenDoor', 'slidingDoor', 'wallPanel', 'skirting', 'samples'];
    
    return [...suborders].sort((a, b) => {
      const aType = a.suborder_type?.typeName || '';
      const bType = b.suborder_type?.typeName || '';
      
      return typeOrder.indexOf(aType) - typeOrder.indexOf(bType);
    });
  };

    const subordersWithError = orderData.suborders
    .filter(sub => {
      const errors = sub.suborderErrors || {};
      console.log(sub?.suborder_type?.typeName)
      return Object.values(errors).some(val => val === true);
    });

  return (
    <div className="factory-presentation">
      <div className="presentation-header">
        <Button type="primary" onClick={saveToPDF}>
          {translations.saveToPDF || "Save to PDF"}
        </Button>

        {subordersWithError.map(sub => (
          <div key={sub.documentId} style={{ marginTop: '15px', color: 'red', fontWeight: 'bold' }}>
            {translations[sub?.suborder_type?.typeName]} : {translations.err}
          </div>
        ))}
      </div>
      
      <div id="factory-presentation-content" className="presentation-content">
        {sortSuborders(orderData.suborders || []).map((suborder, index) => (
          <div style={{marginTop: 80}} key={suborder.documentId || index} className="suborder-section">
            
            {/* Рендерим соответствующий компонент в зависимости от типа suborder */}
            {['door', 'hiddenDoor', 'slidingDoor'].includes(suborder.suborder_type?.typeName) && (
              <DoorFactory suborder={suborder} isPdf={generatingPdf}/>
            )}
            
            {suborder.suborder_type?.typeName === 'wallPanel' && (
              <WallPanelsFactory suborder={suborder} />
            )}
            
            {suborder.suborder_type?.typeName === 'skirting' && (
              <SkirtingFactory suborder={suborder} />
            )}
            
            {suborder.suborder_type?.typeName === 'samples' && (
              <SamplesFactory suborder={suborder} />
            )}

            {/* Рендерим декор для всех подходящих продуктов */}
            {suborder.suborder_products.map((product, prodIndex) => {
              if (['door', 'hiddenDoor', 'slidingDoor', 'wallPanel', 'skirting', 'skirtingInsert', 'sample' ].includes(product.type)) {
                return (
                  <React.Fragment key={prodIndex}>
                    <DecorFactory
                      product={product}
                      isFrontSide={true}
                    />
                    <DecorFactory
                      product={product}
                      isFrontSide={false}
                    />
                  </React.Fragment>
                );
              }
              return null;
            })}
            
            <FrameFactory suborder={suborder} />
            <ElementsFactory suborder={suborder} />
            <HardwareFactory suborder={suborder} />
            <OptionsFactory suborder={suborder} />
          </div>
        ))}
      </div>
      <TotalPriceFactory suborders={orderData.suborders}></TotalPriceFactory>
    </div>
  );
};

export default FactoryPresentation;


