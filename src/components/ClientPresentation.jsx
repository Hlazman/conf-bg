import React, { useContext, useState } from "react";
import { Button, Divider } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import ralToHex from 'ral-to-hex';
import ncsColor from 'ncs-color';
import { LanguageContext } from "../context/LanguageContext";
import DoorPresentation from "../presentation/DoorPresentation";
import WallPanelPresentation from "../presentation/WallPanelPresentation";
import SkirtingPresentation from "../presentation/SkirtingPresentation";
import SamplesPresentation from "../presentation/SamplesPresentation";
import DecorPresentation from "../presentation/DecorPresentation";
import InsertionPresentation from "../presentation/InsertionPresentation";
import FramePresentation from "../presentation/FramePresentation";
import HardwarePresentation from "../presentation/HardwarePresentation";
import ElementPresentation from "../presentation/ElementPresentation";
import OptionsPresentation from "../presentation/OptionsPresentation";
import CustomOptionsPresentation from "../presentation/CustomOptionsPresentation";
import InformationPresentation from "../presentation/InformationPresentation";
import CompanyInformationPresentation from "../presentation/CompanyInformationPresentation";

const baseUrl = process.env.REACT_APP_BASE_URL;

const ClientPresentation = ({ orderData, companyData }) => {
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

  // Функция для определения цвета из кода
  const getColorFromCode = (code) => {
    if (!code) return null;
    if (/^\d{4}$/.test(code)) {
      try {
        return ralToHex(parseInt(code));
      } catch (error) {
        return null;
      }
    }
    if (/^NCS/i.test(code)) {
      try {
        return ncsColor.hex(code);
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  // Функция для отображения изображений
  const renderImage = (imageUrl, alt, type = 'default') => {
    const imageStyles = {
      // 'door': { width: '100%', maxHeight: '400px', objectFit: 'contain' },
      'door': { width: '100%', maxHeight: '400px', objectFit: 'contain' },
      'decor': { width: '150px', height: '150px', objectFit: 'cover' },
      'wallPanel': { width: '100%', height: '400px', objectFit: 'contain' },
      'skirting': { width: '100%', height: '400px', objectFit: 'contain' },
      'hardware': { maxWidth: '150px', height: 'auto', objectFit: 'contain' },
      'default': { maxWidth: '150px', height: 'auto', objectFit: 'contain' },
    };
    
    return imageUrl ? (
      <img 
        alt={alt} 
        // src={`https://dev.api.boki-groupe.com${imageUrl}`} 
        src={`${baseUrl}${imageUrl}`} 
        style={imageStyles[type]}
      />
    ) : (
      <div style={{ 
        width: type === 'decor' ? '150px' : '120px', 
        height: type === 'decor' ? '150px' : '120px', 
        background: '#f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {translations.noImages}
      </div>
    );
  };

  // Сортировка suborders по типу для правильной последовательности отображения
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
        {sortSuborders(orderData.suborders || []).map((suborder, index) => (
          <div style={{marginTop: 80}} key={suborder.documentId || index} className="suborder-section">
            <Divider style={{ borderColor: '#fdf5e6' }} orientation="center">{translations[suborder.suborder_type.typeName]}</Divider>
            
            {/* Рендерим соответствующий компонент в зависимости от типа suborder */}
            {['door', 'hiddenDoor', 'slidingDoor'].includes(suborder.suborder_type?.typeName) && (
              <DoorPresentation suborder={suborder} renderImage={renderImage} />
            )}
            
            {suborder.suborder_type?.typeName === 'wallPanel' && (
              <WallPanelPresentation suborder={suborder} renderImage={renderImage} />
            )}
            
            {suborder.suborder_type?.typeName === 'skirting' && (
              <SkirtingPresentation suborder={suborder} renderImage={renderImage} />
            )}
            
            {suborder.suborder_type?.typeName === 'samples' && (
              <SamplesPresentation suborder={suborder} />
            )}
            
            {/* Рендерим декор для всех подходящих продуктов */}
            {suborder.suborder_products.map((product, prodIndex) => {
              if (['door', 'hiddenDoor', 'slidingDoor', 'wallPanel', 'skirting', 'skirtingInsert', 'sample' ].includes(product.type)) {
                return (
                  <React.Fragment key={prodIndex}>
                    <DecorPresentation
                      product={product}
                      isFrontSide={true}
                      renderImage={renderImage}
                      getColorFromCode={getColorFromCode}
                    />
                    <DecorPresentation
                      product={product}
                      isFrontSide={false}
                      renderImage={renderImage}
                      getColorFromCode={getColorFromCode}
                    />
                  </React.Fragment>
                );
              }
              return null;
            })}
              
              {/* <InsertionPresentation suborder={suborder} /> */}
              {suborder.suborder_type.typeName === 'door' || 
              suborder.suborder_type.typeName === 'hiddenDoor' || 
              suborder.suborder_type.typeName === 'slidingDoor' ? (
                <InsertionPresentation suborder={suborder} />
              ) : null}

              {/* <FramePresentation suborder={suborder} /> */}
              <FramePresentation 
                suborder={suborder} 
                renderImage={renderImage}
                getColorFromCode={getColorFromCode}
              />

              <ElementPresentation
              suborder={suborder}
              renderImage={renderImage}
              getColorFromCode={getColorFromCode}
            />
            <HardwarePresentation suborder={suborder} renderImage={renderImage} isPdf={generatingPdf}/>
            <OptionsPresentation suborder={suborder} />
            <CustomOptionsPresentation suborder={suborder} />
          </div>
        ))}
        {/* Рендерим информацию о заказе один раз после всех субордеров */}
        <InformationPresentation order={orderData} isPdf={generatingPdf} />
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

export default ClientPresentation;

