import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const InsertionPresentation = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  return (
    <div className="insertion-presentation">
      <Divider orientation="left"> {translations.tapSeal}</Divider>
      <Descriptions 
        bordered 
        column={3} 
        size="small"
        styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
        
      >
        <Descriptions.Item label={translations.handleInsert}>
          {suborder.suborder_products[0].knobInsertion ? translations.yes : translations.no}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.mortiseLock}>
          {suborder.suborder_products[0].lockInsertion ? translations.yes : translations.no}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.lbInsert}>
          {suborder.suborder_products[0].spindleInsertion ? translations.yes : translations.no}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.thresholdInsert}>
          {suborder.suborder_products[0].thresholdInsertion ? translations.yes : translations.no}
        </Descriptions.Item>
        
        <Descriptions.Item span={2} label={translations.doorSeal}>
          {suborder.suborder_products[0].doorSeal ? translations[suborder.suborder_products[0].doorSeal] : '-'}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.priceNetto}>
          <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(suborder.suborder_products[0].productCostNetto)} </div>
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default InsertionPresentation;
