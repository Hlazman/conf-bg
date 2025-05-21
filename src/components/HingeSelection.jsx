import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Spin, Empty, Button, message, InputNumber, Alert, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

const GET_HINGES = gql`
  query GetHinges($filters: ProductFiltersInput, $pagination: PaginationArg) {
    products(filters: $filters, pagination: $pagination) {
      documentId
      title
      type
      image {
        url
      }
      collections {
        documentId
        title
      }
    }
  }
`;

const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) {
      documentId
    }
  }
`;

const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) {
      documentId
    }
  }
`;

const GET_SUBORDER_PRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      amount
      product {
        documentId
        brand
        title
        image {
          url
          documentId
        }
        collections {
          documentId
          title
        }
      }
      type
    }
  }
`;

const GET_SUBORDER = gql`
  query GetSuborder($documentId: ID!) {
    suborder(documentId: $documentId) {
      documentId
      hingesCalculatedCount
    }
  }
`;

const HingeSelection = ({ suborderId, collectionId, selectedHinge, onHingeSelect, onAfterSubmit }) => {
  const [hingeProductId, setHingeProductId] = useState(null);
  const [hingeAmount, setHingeAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const doorType = localStorage.getItem('currentType');
  const { translations } = useContext(LanguageContext);

const { loading, error, data } = useQuery(GET_HINGES, {
    variables: {
      filters: {
        type: {
          eqi: "hinge"
        },
        collections: doorType === "hiddenDoor"
          ? undefined // Для hiddenDoor не фильтруем по коллекции
          : collectionId
            ? {
                documentId: {
                  eq: collectionId
                }
              }
            : undefined
      },
      pagination: {
        limit: 30
      }
    },
    skip: doorType !== "hiddenDoor" && !collectionId
  });
  
  const { data: hingeProductData, loading: loadingHingeProduct, refetch: refetchHinge } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "hinge"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  const { data: suborderData, loading: loadingSuborder } = useQuery(GET_SUBORDER, {
    variables: {
      documentId: suborderId
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      message.success(translations.dataSaved);
      setSaving(false);
      refetchHinge();
    },
    onError: (error) => {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  });

  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      setSaving(false);
      refetchHinge();
    },
    onError: (error) => {
      message.error(`${translations.editError}: ${error.message}`);
      setSaving(false);
    }
  });

  const hinges = useMemo(() => {
    if (!data?.products) return [];
    
    // Если тип двери hiddenDoor, фильтруем петли без коллекций
    if (doorType === "hiddenDoor") {
      return data.products.filter(hinge =>
        !hinge.collections || hinge.collections.length === 0
      );
    }

    // Для других типов дверей возвращаем все полученные петли
    return data.products;
  }, [data, doorType]);

  useEffect(() => {
    if (!loadingHingeProduct && hingeProductData && hinges.length > 0) {
      if (hingeProductData.suborderProducts && hingeProductData.suborderProducts.length > 0) {
        const hingeProduct = hingeProductData.suborderProducts[0];
        setHingeProductId(hingeProduct.documentId);
        setHingeAmount(hingeProduct.amount || 0);
        
        if (hingeProduct.product && !selectedHinge) {
          const hingeFromProducts = hinges.find(hinge =>
            hinge.documentId === hingeProduct.product.documentId
          );
          if (hingeFromProducts) {
            onHingeSelect(hingeFromProducts);
          }
        }
      }
    }
  }, [hinges, hingeProductData, loadingHingeProduct, onHingeSelect, selectedHinge]);

  useEffect(() => {
    if (!loadingSuborder && suborderData && suborderData.suborder) {
      const calculatedCount = suborderData.suborder.hingesCalculatedCount;
      if (calculatedCount !== undefined && calculatedCount !== null && !hingeProductId) {
        setHingeAmount(calculatedCount);
      } else if (calculatedCount === undefined || calculatedCount === null) {
        setHingeAmount(0);
      }
    }
  }, [suborderData, loadingSuborder, hingeProductId]);

  const handleSave = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }

    if (!selectedHinge) {
      message.error(`${translations.choose} ${translations.hinge}`);
      return;
    }

    setSaving(true);
    try {
      const hingeData = {
        suborder: suborderId,
        product: selectedHinge.documentId,
        type: "hinge",
        amount: hingeAmount
      };

      if (hingeProductId) {
        await updateSuborderProduct({
          variables: {
            documentId: hingeProductId,
            data: hingeData
          }
        });
      } else {
        await createSuborderProduct({
          variables: {
            data: hingeData
          }
        });
      }

      // Update title in collapse
      if (onAfterSubmit) {
        await onAfterSubmit();
      }

      message.success(translations.dataSaved);
      setSaving(false);
      refetchHinge();
    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

  const handleAmountChange = (value) => {
    setHingeAmount(value || 0);
  };

  if (loading || loadingHingeProduct) return <Spin size="large" />;
  if (error) return <Alert type="error" message={`${translations.loadError}: ${error.message}`} />;
  if (!hinges || hinges.length === 0) return <Empty description={translations.noData} />;

  return (
    <div className="hinge-selection">
      <Divider orientation="left">{translations.selection} {translations.hinge}</Divider>
      <div style={{ display: 'flex', justifyContent: 'right', alignItems: 'center', marginBottom: 32, marginTop: -45 }}>
        <Button 
          type="primary" 
          onClick={handleSave} 
          loading={saving}
          disabled={!selectedHinge}
          style={!hingeProductId? {} : { backgroundColor: '#52C41A' }}
        >
          {hingeProductId? translations.update : translations.save}
        </Button>
      </div>
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 16 }}>{translations.amount}:</span>
            <InputNumber 
              min={0} 
              value={hingeAmount} 
              onChange={handleAmountChange} 
            />

          {suborderData?.suborder?.hingesCalculatedCount !== undefined && (
              <p style={{margin: "10px 0 30px 0", color: '#677' }}>
                {translations.hingesCount}: <strong> {suborderData.suborder.hingesCalculatedCount} </strong>
              </p>
            )}

          </div>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]}>
        {hinges.map(hinge => (
          <Col span={4} key={hinge.documentId}>
            <Card
              hoverable
              cover={
                hinge.image?.url ? 
                <img 
                  alt={hinge.title} 
                  src={`https://dev.api.boki-groupe.com${hinge.image.url}`} 
                  style={{ height: 200, objectFit: 'cover' }}
                /> : 
                <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {translations.noImages}
                </div>
              }
              onClick={() => onHingeSelect(hinge)}
              style={{
                border: selectedHinge?.documentId === hinge.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
              }}
            >
              <Card.Meta title={hinge.title} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HingeSelection;
