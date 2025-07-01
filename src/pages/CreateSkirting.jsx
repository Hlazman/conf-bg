import React, { useState, useEffect, useContext } from "react";
import { Typography, Collapse, Button } from "antd";
import { useApolloClient } from "@apollo/client";
import ErrorAlerts from "../components/ErrorAlerts";
import { fetchSuborderData } from "../api/getSuborderProductsTitle";
import { LanguageContext } from "../context/LanguageContext";
import CommentSelection from '../components/CommentSelection';
import SkirtingSelection from '../components/SkirtingSelection';
import SkirtingInsertSelection from '../components/SkirtingInsertSelection';
import { calculateOrderPriceBySuborder } from '../api/calculateOrderPriceBySuborder';
import { useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";

const { Title } = Typography;

const GET_ORDER_DOCUMENT_ID = gql`
  query Query($documentId: ID!) {
    suborder(documentId: $documentId) {
      order {
        documentId
      }
    }
  }
`;

const CreateSkirting = () => {
  const client = useApolloClient();
  const { translations } = useContext(LanguageContext);
  const suborderId = localStorage.getItem('currentSuborderId');
  const navigate = useNavigate();
  
  const [activeKeys, setActiveKeys] = useState(['1', '2']);
  const [formattedTitles, setFormattedTitles] = useState({});
  const [selectedSkirting, setSelectedSkirting] = useState(null);

  const handleSkirtingSelect = (skirting) => {
    setSelectedSkirting(skirting);
  };

  const onCollapseChange = (keys) => {
    setActiveKeys(keys);
  };

  useEffect(() => {
    if (suborderId) {
      fetchSuborderData(client, suborderId)
        .then(titles => {
          if (titles) {
            setFormattedTitles(titles);
          }
        });
    }
  }, [suborderId, client]);

  const formatItemLabel = (baseLabel, additionalInfo) => {
    if (!additionalInfo) return baseLabel;

    return (
        <span>
          {baseLabel} <span style={{ color: '#00A651', fontWeight: 'bold' }}>: {additionalInfo}</span>
        </span>
      );
  };

  const updateFormattedTitles = async () => {
    if (suborderId) {
      const titles = await fetchSuborderData(client, suborderId);
      if (titles) {
        setFormattedTitles(titles);
      }
      await calculateOrderPriceBySuborder(client, suborderId);
    }
  };

  const handleGoToPresentation = async () => {
    if (!suborderId) return;
    try {
      const { data } = await client.query({
        query: GET_ORDER_DOCUMENT_ID,
        variables: { documentId: suborderId },
        fetchPolicy: "network-only" // чтобы точно получить актуальный id
      });
      const orderDocumentId = data?.suborder?.order?.documentId;
      if (orderDocumentId) {
        navigate(`/presentation/${orderDocumentId}/client`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const items = [
    {
      key: '1',
      label: formatItemLabel(translations.skirting, formattedTitles.skirtingSelection),
      children: <SkirtingSelection 
                  suborderId={suborderId} 
                  onAfterSubmit={updateFormattedTitles}
                  onSkirtingSelect={handleSkirtingSelect}
                />
    },
    {
      key: '2',
      label: formatItemLabel(translations.skirtingInsert, formattedTitles.skirtingDecorSelection),
      children: <SkirtingInsertSelection 
                  suborderId={suborderId} 
                  onAfterSubmit={updateFormattedTitles}
                  selectedSkirting={selectedSkirting}
                  productType={'skirtingInsert'}
                />
    },
    {
      key: '3',
      label: formatItemLabel(translations.comment, formattedTitles.commentSelection),
      children: (
        <CommentSelection 
          suborderId={suborderId}
          onAfterSubmit={updateFormattedTitles}
        />
      )
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>{translations.create} {translations.skirting}</Title>
      <ErrorAlerts suborderId={suborderId} />
      <Collapse 
        activeKey={activeKeys} 
        onChange={onCollapseChange}
        items={items}
      />

      <Button
        type="primary"
        style={{ marginTop: 24 }}
        onClick={handleGoToPresentation}
      >
        {translations.view} {translations.order.toLowerCase()}
      </Button>

    </div>
  );
};

export default CreateSkirting;
