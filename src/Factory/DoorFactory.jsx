import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";


const DoorFactory = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Находим продукт с типом door, hiddenDoor или slidingDoor
  const doorProduct = suborder.suborder_products.find(product => 
    ['door', 'hiddenDoor', 'slidingDoor'].includes(product.type)
  );
  
  if (!doorProduct) return null;

    // Функция для конвертации цены
    const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  const sizes = doorProduct.sizes || {};
  
  return (
    <div className="door-presentation">
      <Divider style={{ borderColor: '#fdf5e6' }} orientation="center">{translations[suborder.suborder_type.typeName]}</Divider>
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

            <Descriptions.Item style={{fontWeight: '700'}} label={doorProduct.product?.title}>
              <div style={{textAlign: 'right'}}> {formatPrice(doorProduct.productCostBasic)} </div>
            </Descriptions.Item>

            <Descriptions.Item label={translations.collection}>
              {doorProduct.product?.collections?.[0]?.title || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.type}>
              {doorProduct.type === 'door' ? translations.inDoor : 
               doorProduct.type === 'hiddenDoor' ? translations.hiDoor : 
               doorProduct.type === 'slidingDoor' ? translations.sliDoor : '-'}
            </Descriptions.Item>

            <Descriptions.Item label={translations.amount}>
              {doorProduct?.amount}
              
            </Descriptions.Item>

            <Descriptions.Item label={translations.doubleDoor}>
              {suborder.double_door ? translations.yes : translations.no}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.doorOpening}>
              {translations[suborder.opening] || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.doorSide}>
              {translations[suborder.side] || '-'}
            </Descriptions.Item>
            
            {/* <Descriptions.Item label={`${translations.height} (${translations[sizes.type]})`}>
              {sizes.height ? `${sizes.height} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={`${translations.width} (${translations[sizes.type]})`}>
              {sizes.width ? `${sizes.width} mm` : '-'}
            </Descriptions.Item> */}

            <Descriptions.Item label={`${translations.height} (${translations.doorCanvas} / ${translations.block} / ${translations.holeWall})`}>
              {sizes.height ? `${sizes.height} mm` : '-'} {"/ "}
              {sizes.blockHeight ? `${sizes.blockHeight} mm` : '-'} {"/ "}
              {sizes.holeHeight ? `${sizes.holeHeight} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={`${translations.width} (${translations.doorCanvas} / ${translations.block} / ${translations.holeWall})` }>
              {sizes.width ? `${sizes.width} mm` : '-'} {"/ "}
              {sizes.blockWidth ? `${sizes.blockWidth} mm` : '-'} {"/ "}
              {sizes.holeWidth ? `${sizes.holeWidth} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.thickness}>
              {sizes.thickness ? `${sizes.thickness} mm` : '-'}
            </Descriptions.Item>

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
            
            <Descriptions.Item label={translations.doorSeal}>
                {suborder.suborder_products[0].doorSeal ? translations[suborder.suborder_products[0].doorSeal] : '-'}
            </Descriptions.Item>

          </Descriptions>

    </div>
  );
};

export default DoorFactory;
