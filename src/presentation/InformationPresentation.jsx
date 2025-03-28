// // InformationPresentation.jsx
// import React, { useContext, useState } from "react";
// import { Descriptions, Checkbox, Divider } from "antd";
// import { LanguageContext } from "../context/LanguageContext";
// import { CurrencyContext } from "../context/CurrencyContext";

// const InformationPresentation = ({ order }) => {
//   const { translations } = useContext(LanguageContext);
//   const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

//   // Состояние для отображения или скрытия скидки
//   const [showDiscount, setShowDiscount] = useState(true);

//   // Функция для конвертации цены
//   const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

//   return (
//     <div style={{marginTop: 40}} className="information-presentation">
//       <Divider orientation="center">{translations.order} {translations.information}</Divider>
//       <Descriptions 
//         bordered 
//         column={3} 
//         size="small"
//         styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
//       >
//         <Descriptions.Item label={translations.deliveryCost}>
//           {formatPrice(order.deliveryCost)}
//         </Descriptions.Item>
        
//         <Descriptions.Item label={translations.installation}>
//           {formatPrice(order.installationCost)}
//         </Descriptions.Item>
        
//         {/* Скидка с чекбоксом для скрытия */}
//         <Descriptions.Item label={translations.discount}>
//           <div style={{ display: "flex", alignItems: "center" }}>
//             <span>{showDiscount ? `${order.clientDiscount || 0}%` : translations.hidden}</span>
//             <Checkbox 
//               style={{ marginLeft: "10px" }} 
//               checked={showDiscount} 
//               onChange={(e) => setShowDiscount(e.target.checked)}
//             >
//               {translations.showDiscount}
//             </Checkbox>
//           </div>
//         </Descriptions.Item>
        
//         <Descriptions.Item label={translations.priceNetto}>
//           {formatPrice(order.totalCostNetto)}
//         </Descriptions.Item>
        
//         <Descriptions.Item label={translations.tax}>
//           {order.totalTaxAmount || 0}
//         </Descriptions.Item>
        
//         <Descriptions.Item label={translations.priceBrutto}>
//           {formatPrice(order.totalCostBrutto)}
//         </Descriptions.Item>
//       </Descriptions>
//     </div>
//   );
// };

// export default InformationPresentation;

// InformationPresentation.jsx
import React, { useContext, useState } from "react";
import { Descriptions, Checkbox, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const InformationPresentation = ({ order, isPdf }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Состояние для отображения или скрытия скидки
  const [showDiscount, setShowDiscount] = useState(true);

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  return (
    <div style={{marginTop: 40}} className="information-presentation">
      <Divider orientation="center">{translations.order} {translations.information}</Divider>
      
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
          {order.totalTaxAmount || 0}
        </Descriptions.Item>
        
        <Descriptions.Item label={translations.priceBrutto}>
          {formatPrice(order.totalCostBrutto)}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default InformationPresentation;
