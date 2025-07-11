import React, { useContext, useState, useMemo } from "react";
import { Descriptions, Checkbox, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const InformationPresentation = ({ order, isPdf }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);
  console.log(order)
  // Состояние для отображения или скрытия скидки
  const [showDiscount, setShowDiscount] = useState(true);

  // Вычисления suborders
  const subordersSummary = useMemo(() => {
    if (!order?.suborders) return [];

    return order.suborders.map((suborder) => {
      const { suborder_type, suborder_products = [], amount } = suborder;
      const typeName = suborder_type?.typeName || "";

      // Ищем первый продукт с совпадающим type
      const matchedProduct = suborder_products.find((p) => p.type === typeName);

      // Берем title из product если найдено совпадение
      const title = matchedProduct?.product?.title || "";

      // Считаем сумму productCostNetto * amount, округляем ВВЕРХ до 2 знаков
      const total = suborder_products.reduce((sum, product) => {
        const cost = Number(product.productCostNetto) || 0;
        const amount = Number(product.amount) || 1;
        // return sum + cost * amount;
        return sum + cost;
      }, 0);
      // const totalCeil = Math.ceil(total * 100) / 100;
      const totalCeil = total * amount;

      return { typeName, title, totalCeil, amount };
    });
  }, [order?.suborders]);

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  return (
    <div style={{marginTop: 40}} className="information-presentation">
      <Divider orientation="center">{translations.order} {translations.information}</Divider>

      <Descriptions
        bordered
        column={1}
        size="small"
        style={{ marginBottom: 24 }}
        styles={{ label: { backgroundColor: "#fdf5e6", fontWeight: "bold" } }}
      >
        {subordersSummary.map((sub, idx) => (
          <Descriptions.Item
            key={idx}
            label={
              sub.title
                ? `${translations[sub.typeName]} (${sub.title}) ${sub.amount} ${translations.pcs}`
                : translations[sub.typeName]
                // ? `${sub.typeName} (${sub.title})`
                // : sub.typeName
            }
          >
            {/* {sub.totalCeil} */}
            {formatPrice(sub.totalCeil)}

          </Descriptions.Item>
        ))}
      </Descriptions>
      
      {!isPdf && (
        <div style={{ marginBottom: 10 }}>
          <Checkbox 
            checked={showDiscount} 
            onChange={(e) => setShowDiscount(e.target.checked)}
          >
            {translations.showDiscount}
          </Checkbox>
        </div>
      )}
      
      <Descriptions 
        bordered 
        column={3} 
        size="small"
        styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
      >
        <Descriptions.Item label={translations.deliveryCost}>
          {formatPrice(order.deliveryCost)}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.installation}>
          {formatPrice(order.installationCost)}
        </Descriptions.Item>
        
        {/* Скидка отображается только если showDiscount = true */}
        {showDiscount && (
          <Descriptions.Item label={translations.discount}>
            {`${order.clientDiscount || 0}%`}
          </Descriptions.Item>
        )}
        
        <Descriptions.Item label={translations.priceNetto}>
          {formatPrice(order.totalCostNetto)}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.tax}>
          {/* {order.totalTaxAmount || 0} */}
          {formatPrice(order.totalTaxAmount)}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.priceBrutto}>
          {formatPrice(order.totalCostBrutto)}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default InformationPresentation;
