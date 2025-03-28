import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const SkirtingFactory = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  const skirtingProduct = suborder.suborder_products.find(product => 
    product.type === 'skirting'
  );
  
  if (!skirtingProduct) return null;

  // Считаем общую стоимость продуктов в субордере
  const calculateTotalNettoPrice = () => {
    const productTypes = [
      "skirting",
      "skirtingInsert",
      "skirtingMilling"
    ];
    const totalNetto = suborder.suborder_products
      .filter(product => productTypes.includes(product.type))
      .reduce((sum, product) => sum + (product.productCostBasic || 0), 0);

    return convertFromEUR(totalNetto).toFixed(2);
  };
  
  const sizes = skirtingProduct.sizes || {};
  const hasSkirtingMilling = suborder.suborder_products.some(product => product.type === 'skirtingMilling');
  
  return (
    <div className="skirting-presentation">
      <Divider style={{ borderColor: '#fdf5e6' }} orientation="center">{translations[suborder.suborder_type.typeName]}</Divider>
          <Descriptions 
            bordered 
            column={1} 
            size="small"
            styles={{ 
              label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
              content: { width: '50%' } 
            }}
          >
            <Descriptions.Item style={{fontWeight: '700'}} label={translations[skirtingProduct.product?.title]}>
              <div style={{textAlign: 'right', fontWeight: 'bold'}}> {calculateTotalNettoPrice()} {getCurrencySymbol()} </div>
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.length}>
              {sizes.length ? `${sizes.length} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations["Milling insert"]}>
              {hasSkirtingMilling ? translations.yes : translations.no}
            </Descriptions.Item>

          </Descriptions>
    </div>
  );
};

export default SkirtingFactory;
