import React, { useContext, useState, useMemo } from "react";
import { Descriptions, Checkbox, Divider } from "antd";
import { FileImageOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

const InformationPresentationShort = ({ order, isPdf }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Состояние для отображения или скрытия скидки
  const [showDiscount, setShowDiscount] = useState(true);

  // Вычисления suborders
  const subordersSummary = useMemo(() => {
    if (!order?.suborders) return [];

    return order.suborders.map((suborder) => {
      const { suborder_type, suborder_products = [], amount, opening, side } = suborder;
      const typeName = suborder_type?.typeName || "";
      const matchedProduct = suborder_products.find((p) => p.type === typeName);
      const title = matchedProduct?.product?.title || "";
      const url = matchedProduct?.product?.image?.url || "";
        
      const height = matchedProduct?.sizes?.height || "";
      const width = matchedProduct?.sizes?.width || "";
      const thickness = matchedProduct?.sizes?.thickness || "";
      const length = matchedProduct?.sizes?.length || "";

      const total = suborder_products.reduce((sum, product) => {
      const cost = Number(product.productCostNetto) || 0;
      const amount = Number(product.amount) || 1;
      // return sum + cost * amount;
      return sum + cost;
    }, 0);
        
      const totalCeil = total * amount;

      return { typeName, title, totalCeil, amount, url, opening, side, height, width, thickness, length };
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
        styles={{ label: { backgroundColor: "#fdf5e6" } }}
      >

        {subordersSummary.map((sub, idx) => {
            const sizeParts = [];
            if (sub.height) sizeParts.push(sub.height);
            if (sub.width) sizeParts.push(sub.width);
            if (sub.thickness) sizeParts.push(sub.thickness);
            if (sub.length) sizeParts.push(sub.length);
            const sizesString = sizeParts.join(" x ");

            const labelParts = [];
            if (sub.width) labelParts.push(translations.width);
            if (sub.height) labelParts.push(translations.height);
            if (sub.thickness) labelParts.push(translations.thickness);
            if (sub.length) labelParts.push(translations.length);
            const labelsString = labelParts.join(", ");

            return (
              <Descriptions.Item
                key={idx}
                label={
                  <>
                    {sub.url && (
                      <a
                        href={baseUrl + sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginRight: 6 }}
                      >
                        <FileImageOutlined
                          style={{
                          color: "#1677ff",
                          verticalAlign: "middle"
                          }}
                        />
                      </a>
                    )}
                    <span style={{ fontWeight: 'bold' }}>
                      {translations[sub.typeName]}
                      {sub.title && <> {sub.title}</>}
                    </span>
                    {[
                      sub.amount ? `${sub.amount} ${translations.pcs}` : null,
                      sub.side,
                      sub.opening,
                      sizesString,
                      labelsString ? `(${labelsString})` : null,
                    ]
                      .filter(Boolean)
                      .map((part, idx) => (
                      <React.Fragment key={idx}>{","} {part}</React.Fragment>
                    ))}
                  </>
                }
              >
                {formatPrice(sub.totalCeil)}
              </Descriptions.Item>
            );
        })}


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
          {formatPrice(order.totalTaxAmount)}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.priceBrutto}>
          {formatPrice(order.totalCostBrutto)}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default InformationPresentationShort;
