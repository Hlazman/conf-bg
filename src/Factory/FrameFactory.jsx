import React, { useContext } from "react";
import { Descriptions } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const FrameFactory = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Находим продукты с типами frame и slidingFrame
  const frameProduct = suborder.suborder_products.find(product => product.type === "frame");
  const slidingFrameProduct = suborder.suborder_products.find(product => product.type === "slidingFrame");
  // const doorstepProduct = suborder.suborder_products.find(product => product.type === "treshold");
  const doorProductTreshold = suborder.suborder_products.find(product => product.type === "door" || product.type === "hiddenDoor");

  if (!frameProduct && !slidingFrameProduct) return null;

  // Проверяем наличие frameTreshold
  const hasTreshold = doorProductTreshold?.frameTreshold === true;

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  return (
    <div style={{marginTop: 20}} className="frame-presentation">
      <Descriptions 
        bordered
        column={1} 
        size="small"
        styles={{ 
            label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
            content: { width: '50%' } 
          }}
      >
        {/* Если есть продукт типа frame */}
        {frameProduct && (
          <>
            {/* <Descriptions.Item label={translations[[frameProduct.product?.title]]}> */}
            <Descriptions.Item 
              label={
                <>
                  {translations[frameProduct.product?.title]}
                  {hasTreshold && ` + ${translations.treshold}`}
                </>
                }
              >
              <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(frameProduct.productCostBasic)} </div>
            </Descriptions.Item>

            {/* Если есть doorstep для frame */}
            {/* {doorstepProduct && (
              <Descriptions.Item label={translations[doorstepProduct.product?.title]}>
                <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(doorstepProduct.productCostBasic)} </div>
              </Descriptions.Item>
            )} */}
          </>
        )}

        {/* Если есть продукт типа slidingFrame */}
        {slidingFrameProduct && (
          <>
            <Descriptions.Item label={slidingFrameProduct.product?.title}>
            <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(slidingFrameProduct.productCostBasic)} </div>
            </Descriptions.Item>

            <Descriptions.Item label={translations.description}>
              {slidingFrameProduct.product?.description || '-'}
            </Descriptions.Item>

          </>
        )}
      </Descriptions>
    </div>
  );
};

export default FrameFactory;
