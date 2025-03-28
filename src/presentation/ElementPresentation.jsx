import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";
import DecorPresentation from "./DecorPresentation";

const ElementPresentation = ({ suborder, renderImage, getColorFromCode }) => {
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
        const sizeType = Object.keys(product.sizes || {}).find(key => product.sizes[key] !== null);
        const sizeValue = sizeType ? `${product.sizes[sizeType]} mm` : '-';

        return (
          <div style={{marginTop: 20}} key={index} className="additional-element-item">
            <Divider orientation="left">{translations[product.product?.title]}</Divider>
            {/* Информация о продукте */}
            <Descriptions 
              bordered 
              column={2} 
              size="small"
              styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
            >
              {/* <Descriptions.Item label={`${translations.element} #${index + 1}`}>
                <strong>{translations.title}:</strong> {product.product?.title || '-'}
              </Descriptions.Item> */}
              <Descriptions.Item label={`${translations[sizeType] || sizeType}`}>
                {sizeValue}
              </Descriptions.Item>
              <Descriptions.Item label={translations.priceNetto}>
                {/* {formatPrice(product.productCostNetto)} */}
                <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(product.productCostNetto)} </div>
              </Descriptions.Item>
            </Descriptions>

            {/* Декор продукта */}
            {(product.decor_type || product.colorCode) && (
              <DecorPresentation
                product={product}
                isFrontSide={true}
                renderImage={renderImage}
                getColorFromCode={getColorFromCode}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ElementPresentation;
