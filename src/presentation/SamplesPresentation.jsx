import React, { useContext } from "react";
import { Descriptions } from "antd";
import { LanguageContext } from "../context/LanguageContext";

const SamplesPresentation = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);

  const samplesProducts = suborder.suborder_products.filter(product => 
    product.type === 'sample'
  );
  
  if (!samplesProducts || samplesProducts.length === 0) return null;
  
  return (
    <div className="samples-presentation">
      <Descriptions 
        bordered 
        column={1} 
        size="small"
        styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
      >
        {samplesProducts.map((product, index) => (
          <Descriptions.Item key={index} label={translations.title}>
            {product.product?.title || product.customTitle || '-'}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  );
};

export default SamplesPresentation;
