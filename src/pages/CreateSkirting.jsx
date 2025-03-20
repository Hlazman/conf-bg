import React, { useState, useEffect, useContext } from "react";
import { Typography, Collapse } from "antd";
import { useApolloClient } from "@apollo/client";
import ErrorAlerts from "../components/ErrorAlerts";
import { fetchSuborderData } from "../api/getSuborderProductsTitle";
import { LanguageContext } from "../context/LanguageContext";
import CommentSelection from '../components/CommentSelection';
import SkirtingSelection from '../components/SkirtingSelection';
import SkirtingInsertSelection from '../components/SkirtingInsertSelection';

const { Title } = Typography;

const CreateSkirting = () => {
  const client = useApolloClient();
  const { translations } = useContext(LanguageContext);
  const suborderId = localStorage.getItem('currentSuborderId');
  
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
    }
  };

  const items = [
    {
      key: '1',
      label: formatItemLabel(translations.skirting, formattedTitles.skirtingSelection),
      children: <SkirtingSelection 
                  suborderId={suborderId} 
                  onAfterSubmit={updateFormattedTitles}
                  onSkirtingSelect={handleSkirtingSelect} // Добавляем обработчик выбора плинтуса
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
    </div>
  );
};

export default CreateSkirting;
