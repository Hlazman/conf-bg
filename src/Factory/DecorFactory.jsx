import React, { useContext } from "react";
import { Descriptions } from "antd";
import { LanguageContext } from "../context/LanguageContext";

const DecorFactory = ({ product, isFrontSide = true, customTitle = null, }) => {
  const { translations } = useContext(LanguageContext);

  if (!product) return null;
  
  const decorType = isFrontSide ? product.decor_type : product.secondSideDecorType;
  const decor = isFrontSide ? product.decor : product.secondSideDecor;
  const colorCode = isFrontSide ? product.colorCode : product.secondSideColorCode;
  const veneerDirection = isFrontSide ? product.veneerDirection : product.secondSideVeneerDirection;
  
  if (!decorType || (!decor && !colorCode)) return null;
  
  const isPaintType = decorType && ['Paint', 'Paint glass', 'Paint veneer'].includes(decorType.typeName);
  const title = customTitle || (isFrontSide ? translations.decorFront : translations.decorBack);
  
  return (
    <div className="decor-presentation">
          <Descriptions 
            bordered 
            column={1} 
            size="small"
            style={{ width: '100%' }}
            styles={{ 
              label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
              content: { width: '50%' } 
            }}
          > 
            <Descriptions.Item label={`${product?.type === 'skirtingInsert' ? translations.insert : ''} ${title}`}>
              <span>{translations[decorType.typeName]}, </span>
              {decorType.typeName === 'Veneer' && veneerDirection && (<span> {translations[veneerDirection]}, </span>)}
              <span> {decor?.title || ''} {isPaintType && colorCode ? ` (${colorCode})` : ''} </span> 
            </Descriptions.Item>
          </Descriptions>
    </div>
  );
};

export default DecorFactory;
