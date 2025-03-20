import React, { useState, useEffect, useContext } from "react";
import { Typography, Collapse } from "antd";
import { useApolloClient } from "@apollo/client";
import ErrorAlerts from "../components/ErrorAlerts";
import { fetchSuborderData } from "../api/getSuborderProductsTitle";
import { LanguageContext } from "../context/LanguageContext";
import SampleSelection from '../components/SampleSelection';
import CommentSelection from '../components/CommentSelection';

const { Title } = Typography;

const CreateSamples = () => {
  const client = useApolloClient();
  const { translations } = useContext(LanguageContext);
  const suborderId = localStorage.getItem('currentSuborderId');
  
  const [activeKeys, setActiveKeys] = useState(['1']);
  const [formattedTitles, setFormattedTitles] = useState({});

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
      label: formatItemLabel(translations.samples, formattedTitles.sampleslSelection),
      children: <SampleSelection 
                  suborderId={suborderId}
                  onAfterSubmit={updateFormattedTitles}
                />
    },
    {
      key: '2',
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
      <Title level={2}>{translations.create} {translations.samples}</Title>
      <ErrorAlerts suborderId={suborderId} />
      <Collapse 
        activeKey={activeKeys} 
        onChange={onCollapseChange}
        items={items}
      />
    </div>
  );
};

export default CreateSamples;
