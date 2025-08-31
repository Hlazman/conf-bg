import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const WallPanelFaktory = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  const wallPanelProduct = suborder.suborder_products.find(product => 
    product.type === 'wallPanel'
  );
  
  if (!wallPanelProduct || wallPanelProduct?.product?.brand === 'CharmWood') return null;

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  const sizes = wallPanelProduct.sizes || {};
  // const area = sizes.height && sizes.width ? Math.round((sizes.height * sizes.width) / 1000000) : 0;
  const area = parseFloat(((sizes.height * sizes.width) / 1000000).toFixed(2));
  
  return (
    <div className="wall-panel-presentation">
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
            <Descriptions.Item style={{fontWeight: '700'}} label={translations[wallPanelProduct.product?.title]}>
              <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(wallPanelProduct.productCostBasic)} </div>
            </Descriptions.Item>
            
            <Descriptions.Item label={`${translations.height}`}>
              {sizes.height ? `${sizes.height} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={`${translations.width}`}>
              {sizes.width ? `${sizes.width} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.area}>
              {area > 0 ? `${area} m²` : '-'}
            </Descriptions.Item>

          </Descriptions>
    </div>
  );
};

export default WallPanelFaktory;
