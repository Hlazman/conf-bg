// FramePresentation.jsx
import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const FramePresentation = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Находим продукты с типами frame и slidingFrame
  const frameProduct = suborder.suborder_products.find(product => product.type === "frame");
  const slidingFrameProduct = suborder.suborder_products.find(product => product.type === "slidingFrame");
  const doorstepProduct = suborder.suborder_products.find(product => product.type === "treshold");

  if (!frameProduct && !slidingFrameProduct) return null;

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

    // Определяем заголовок в зависимости от наличия типов продуктов
    const dividerTitle = slidingFrameProduct ? translations.slidingFrame : translations.frame;

  return (
    <div style={{marginTop: 20}} className="frame-presentation">
      <Divider orientation="left">{dividerTitle}</Divider>
      <Descriptions 
        bordered
        column={frameProduct ? 2 : 3} 
        size="small"
        styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
      >
        {/* Если есть продукт типа frame */}
        {frameProduct && (
          <>
            <Descriptions.Item label={translations.frame}>
              {translations[frameProduct.product?.title] || frameProduct.product?.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={translations.priceNetto}>
            <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(frameProduct.productCostNetto)} </div>
              {/* {formatPrice(frameProduct.productCostNetto)} */}
            </Descriptions.Item>

            {/* Если есть doorstep для frame */}
            {doorstepProduct && (
              <>
                <Descriptions.Item label={translations["frame Treshold"]}>
                  {translations[doorstepProduct.product?.title] || doorstepProduct.product?.title || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={translations.priceNetto}>
                <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(doorstepProduct.productCostNetto)} </div>
                  {/* {formatPrice(doorstepProduct.productCostNetto)} */}
                </Descriptions.Item>
              </>
            )}
          </>
        )}

        {/* Если есть продукт типа slidingFrame */}
        {slidingFrameProduct && (
          <>
            <Descriptions.Item label={translations.slidingFrame}>
              {translations[slidingFrameProduct.product?.title] || slidingFrameProduct.product?.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={translations.description}>
              {slidingFrameProduct.product?.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={translations.priceNetto}>
              {/* {formatPrice(slidingFrameProduct.productCostNetto)} */}
              <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(slidingFrameProduct.productCostNetto)} </div>
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </div>
  );
};

export default FramePresentation;
