import React, { useEffect, useState, useContext } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import ClientPresentation from "../components/ClientPresentation";
import FactoryPresentation from "../components/FactoryPresentation";
import { Spin, Alert } from "antd";
import { LanguageContext } from "../context/LanguageContext";

// GraphQL запрос для получения данных заказа
const GET_ORDER = gql`
  query GetOrder($documentId: ID!, $pagination: PaginationArg) {
    order(documentId: $documentId) {
      documentId
      orderNumber
      deliveryCost
      clientDiscount
      taxRate
      clientExtraPay
      comment
      agent {
        documentId
        name
      }
      client {
        documentId
        name
      }
      company {
        documentId
      }
      agentFee
      totalCostBasic
      totalCostBrutto
      totalCostNetto
      totalTaxAmount
      suborders(pagination: $pagination) {
        documentId
        comment
        double_door
        hidden
        hingesCalculatedCount
        opening
        order {
          documentId
        }
        side
        suborderCost
        suborderErrors {
          decorError
          frameError
          extenderError
          platbandError
          platbandThreadError
          platbandFrontError
          platbandBackError
          aluminumMoldingError
          aluminumFrameError
          aluminumCladdingError
          optionError
        }
        suborder_type {
          documentId
          typeName
        }
        suborder_products {
          amount
          colorCode
          customImage {
            documentId
            url
          }
          customTitle
          decor {
            category
            documentId
            image {
              url
              documentId
            }
            title
          }
          decor_type {
            documentId
            typeName
          }
          doorSeal
          knobInsertion
          lockInsertion
          product {
            title
            documentId
            brand
          }
          productCostBasic
          productCostNetto
          secondSideColorCode
          secondSideDecor {
            title
            category
            documentId
            image {
              documentId
              url
            }
          }
          secondSideDecorType {
            documentId
            typeName
          }
          secondSideVeneerDirection
          sizes {
            height
            length
            thickness
            type
            width
            id
            units
          }
          spindleInsertion
          thresholdInsertion
          type
          veneerDirection
          documentId
        }
      }
    }
  }
`;

const Presentation = () => {
const { orderId, presentationType } = useParams();
const { translations } = useContext(LanguageContext);
  
  // Запрос данных заказа
  const { loading, error, data } = useQuery(GET_ORDER, {
    variables: {
      documentId: orderId,
      pagination: {
        limit: 100
      }
    },
    fetchPolicy: "network-only" // Всегда получаем свежие данные
  });

  if (loading) return <Spin size="large" tip={translations.loading} fullscreen={true} />;
  
  if (error) return (
    <Alert
      message={translations.err}
      description={`${translations.faildData}: ${error.message}`}
      type="error"
    />
  );

  if (!data || !data.order) return (
    <Alert
      message={translations.noData}
      description={translations.noOrder}
      type="warning"
    />
  );

  return (
    <div className="presentation-container">
      {presentationType === 'client' && (
        <ClientPresentation orderData={data.order} />
      )}
      
      {presentationType === 'factory' && (
        <FactoryPresentation orderData={data.order} />
      )}
      
      {!presentationType && (
        <Alert
          message={translations.noData}
          description={translations.noOrder}
          type="info"
        />
      )}
    </div>
  );
};

export default Presentation;
