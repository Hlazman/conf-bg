import React, {useContext } from "react";
import { useParams } from "react-router-dom"; 
import { gql, useQuery } from "@apollo/client";
import ClientPresentation from "../components/ClientPresentation";
import ShortPresentation from "../components/ShortPresentation";
import FactoryPresentation from "../components/FactoryPresentation";
import { Spin, Alert } from "antd";
import { LanguageContext } from "../context/LanguageContext";

// GraphQL запрос для получения данных заказа
const GET_ORDER = gql`
  query GetOrder($documentId: ID!, $subordersPagination: PaginationArg, $productsPagination: PaginationArg) {
    order(documentId: $documentId) {
      documentId
      metaData
      orderNumber
      deliveryCost
      clientDiscount
      taxRate
      clientExtraPay
      installationCost
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
      suborders(pagination: $subordersPagination) {
        documentId
        amount
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
          doorParamsError
          hingeError
          slidingError
        }
        suborder_type {
          documentId
          typeName
        }
        suborder_products(pagination: $productsPagination) {
          amount
          comment
          frameTreshold
          framePainting
          type
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
          doorFilling
          knobInsertion
          lockInsertion
          product {
            title
            type
            documentId
            brand
            description
            guarantee
            collections {
              title
              documentId
            }
            image {
              url
              documentId
            }
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
            holeWidth
            holeHeight
            blockWidth
            blockHeight
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

// Добавляем новый запрос для получения данных компании
const GET_COMPANY = gql`
  query Company($documentId: ID!) {
    company(documentId: $documentId) {
      logo {
        documentId
        url
      }
      documentId
      email
      name
      phone
      site
      address
      metaData
    }
  }
`;

const Presentation = () => {
  const { orderId, presentationType } = useParams();
  const { translations } = useContext(LanguageContext);
  const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany"));
  const companyId = selectedCompany?.documentId;

  const { loading: orderLoading, error: orderError, data: orderData } = useQuery(GET_ORDER, {
    variables: {
      documentId: orderId,
      subordersPagination: {
        limit: 100
      },
      productsPagination: {
        limit: 100
      }
    },
    fetchPolicy: "network-only"
  });

  // Запрос данных компании
  const { loading: companyLoading, error: companyError, data: companyData } = useQuery(GET_COMPANY, {
    variables: {
      documentId: companyId
    },
    skip: !companyId // Пропускаем запрос, если нет ID компании
  });

  if (orderLoading || companyLoading) return <Spin size="large" tip={translations.loading} fullscreen={true} />;
  
  if (orderError || companyError) return (
    <Alert
      message={translations.err}
      description={`${translations.faildData}: ${orderError?.message || companyError?.message}`}
      type="error"
    />
  );

  if (!orderData || !orderData.order) return (
    <Alert
      message={translations.noData}
      description={translations.noOrder}
      type="warning"
    />
  );

  return (
    <div className="presentation-container">
      {presentationType === 'client' && (
        <ClientPresentation orderData={orderData.order} companyData={companyData?.company} />
      )}

      {presentationType === 'short' && (
        <ShortPresentation orderData={orderData.order} companyData={companyData?.company} />
      )}
      
      {presentationType === 'factory' && (
        <FactoryPresentation orderData={orderData.order} />
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