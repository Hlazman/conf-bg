import React, { useContext } from "react";
import { Descriptions } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";
import DecorFactory from "./DecorFactory";

const ElementsFactory = ({ suborder, renderImage, getColorFromCode }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Фильтруем продукты с указанными типами
  const elementTypes = [
    "aluminumCladding",
    "aluminumFrame",
    "aluminumMolding",
    "kapitel",
    "platbandBack",
    "platbandFront",
    "platbandThread",
    "platband",
    "extender"
  ];
  
  const additionalElements = suborder.suborder_products.filter(product =>
    elementTypes.includes(product.type)
  );

  if (additionalElements.length === 0) return null;

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  return (
    <div className="additional-element-presentation">
      {additionalElements.map((product, index) => {
        // Определяем размер продукта (может быть только один вариант: высота, ширина, длина или толщина)
        // const sizeType = Object.keys(product.sizes || {}).find(key => product.sizes[key] !== null);
        // const sizeValue = sizeType ? `${product.sizes[sizeType]} mm` : '-';

        const sizeKeys = ['length', 'thickness', 'height', 'width'];
        const displaySizes = sizeKeys
          .filter(key => product.sizes && product.sizes[key] != null && product.sizes[key] !== 0)
          .map(key => {
            // Можно красиво перевести ключи, если нужно (иначе оставить просто key)
            const label = translations[key] || key;
            return `${label}: ${product.sizes[key]} mm`;
          });

        const sizeValue = displaySizes.length > 0 ? displaySizes.join(', ') : '-';

        return (
          <div style={{marginTop: 20}} key={index} className="additional-element-item">
            <Descriptions
              bordered 
              column={1} 
              size="small"
              styles={{ 
                label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
                content: { width: '50%' } 
              }}
            >
              <Descriptions.Item label={translations[product.product?.title]}>
                <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(product.productCostBasic)} </div>
              </Descriptions.Item>

              {/* <Descriptions.Item label={`${translations[sizeType] || sizeType}`}> */}
              <Descriptions.Item label={translations.size}>
                {sizeValue}
              </Descriptions.Item>

            </Descriptions>

            {/* Декор продукта */}
            {(product.decor_type || product.colorCode) && (
              <DecorFactory
                product={product}
                isFrontSide={true}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ElementsFactory;
