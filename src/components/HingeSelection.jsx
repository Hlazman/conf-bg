import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Spin, Empty, Button, message, InputNumber, Alert, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import ArchiveOverlay from './ArchiveOverlay';

const baseUrl = process.env.REACT_APP_BASE_URL;

const GET_HINGES = gql`
  query GetHinges($filters: ProductFiltersInput, $pagination: PaginationArg) {
    products(filters: $filters, pagination: $pagination) {
      documentId
      archive
      decorCombinations
      title
      type
      image {
        url
      }
      collections {
        documentId
        title
      }
      compatibleHiddenHinges { 
        documentId
      }
      compatibleSimpleHinges { 
        documentId
      }
       maxSizes {
        height
      }
      decor_types {
        documentId
        typeName
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
        description
        type
      maxSizes {
        height
        width
      }
      collections { 
        documentId
        title 
      }
      compatibleHiddenHinges { 
        documentId
      }
      compatibleSimpleHinges { 
        documentId
      }
      compatibleHiddenFrames {
        documentId
      }
      compatibleSimpleFrames {
        documentId
      }
      guarantee
      brand
      title
      image {
        url
        documentId
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

const GET_SUBORDER_DOORPRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      decor_type {
        documentId
        typeName
      }
      sizes {
        height
      }
      product {
        documentId
        title
      }
      type
    }
  }
`;

const HingeSelection = ({ 
  suborderId, 
  collectionId, 
  selectedHinge, 
  onHingeSelect, 
  onAfterSubmit, 
  doorId,
}) => {
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
          ...(doorType === "hiddenDoor"
            ? { // Фильтруем по compatibleHiddenHinges, если doorType - hiddenDoor
                compatibleHiddenHinges: {
                  documentId: {
                    eq: doorId // Используем doorId
                  }
                }
              }
            : doorType === "door"
            ? { // Фильтруем по compatibleSimpleHinges, если doorType - door
                compatibleSimpleHinges: {
                  documentId: {
                    eq: doorId // Используем doorId
                  }
                }
              }
            : {}
          )
        },
        pagination: {
          limit: 200
        }
      },
      skip: !doorId // Пропускаем запрос, если doorId недоступен
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

  const { data: doorDecorData } = useQuery(GET_SUBORDER_DOORPRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          in: ["door", "hiddenDoor"]
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
    
    return data.products;
  }, [data]);

  // const doorDecorType = doorDecorData?.suborderProducts?.[0]?.decor_type?.typeName;
  // const doorProductTitle = doorDecorData?.suborderProducts?.[0]?.product?.title;
  // const doorHeight = doorDecorData?.suborderProducts?.[0]?.sizes?.height;

  // const filteredHinges = useMemo(() => {
  //   if (!hinges) return [];

  //   const filtered = hinges.filter(hinge => {
  //     // Проверка decor_types — обычное совпадение
  //     const decorTypes = hinge.decor_types || [];
  //     const decorMatch = !doorDecorType || decorTypes.some(dt => dt.typeName === doorDecorType);

  //     // Исключительный кейс с decorCombinations
  //     let exceptionMatch = false;
  //     if (!decorMatch && hinge.decorCombinations && doorProductTitle && doorDecorType) {
  //       // decorCombinations может быть строкой с JSON — обработаем оба варианта
  //       let combos = hinge.decorCombinations;
  //       if (typeof combos === 'string') {
  //         try {
  //           combos = JSON.parse(combos);
  //         } catch {
  //           combos = {};
  //         }
  //       }
  //       if (
  //         combos &&
  //         combos[doorProductTitle] &&
  //         combos[doorProductTitle].includes(doorDecorType)
  //       ) {
  //         exceptionMatch = true;
  //       }
  //     }

  //     // Проверка maxSizes и высоты
  //     const hasMaxSizes = Array.isArray(hinge.maxSizes) && hinge.maxSizes.length > 0;
  //     const maxHeight = hasMaxSizes
  //       ? Math.max(...hinge.maxSizes.map(s => s.height || 0))
  //       : undefined;
  //     const heightMatch = !doorHeight || !hasMaxSizes || doorHeight <= maxHeight;

  //     // Показываем если совпало по decor_types или это исключение + подходит по высоте
  //     return (decorMatch || exceptionMatch) && heightMatch;
  //   });

  //   // Оставляем только петли с maxSizes, если есть хотя бы одна такая, иначе все
  //   const hasHingeWithSizes = filtered.some(hinge => Array.isArray(hinge.maxSizes) && hinge.maxSizes.length > 0);
  //   if (hasHingeWithSizes) {
  //     return filtered.filter(hinge => Array.isArray(hinge.maxSizes) && hinge.maxSizes.length > 0);
  //   }
  //   return filtered;
  // }, [hinges, doorDecorType, doorProductTitle, doorHeight]);



const doorProductTitle = doorDecorData?.suborderProducts?.[0]?.product?.title;
const doorDecorType = doorDecorData?.suborderProducts?.[0]?.decor_type?.typeName;
const doorHeight = doorDecorData?.suborderProducts?.[0]?.sizes?.height;

const filteredHinges = useMemo(() => {
  if (!hinges) return [];

  return hinges.filter(hinge => {
    // decorCombinations парсим, если это строка
    let combos = hinge.decorCombinations;
    if (combos && typeof combos === 'string') {
      try {
        combos = JSON.parse(combos);
      } catch {
        combos = {};
      }
    }

    // Если для этой петли есть decorCombinations с ключом = названию двери
    if (combos && doorProductTitle && combos[doorProductTitle]) {
      const { Decors, maxHeight, minHeight } = combos[doorProductTitle];

      // Проверяем декоры
      if (Array.isArray(Decors) && Decors.length > 0 && doorDecorType) {
        if (!Decors.includes(doorDecorType)) {
          return false; // декор двери не разрешён
        }
      }

      // Проверяем максимальную высоту
      if (maxHeight !== null && doorHeight && +doorHeight > +maxHeight) {
        return false;
      }
      // Проверяем минимальную высоту
      if (minHeight !== null && doorHeight && +doorHeight < +minHeight) {
        return false;
      }

      return true; // все ограничения выполнены
    }

    // Если нет decorCombinations для этой двери, просто по совместимости
    return true;
  });
}, [hinges, doorProductTitle, doorDecorType, doorHeight]);



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
        {/* {hinges.map(hinge => ( */}
        {filteredHinges.map(hinge => (
          <Col span={4} key={hinge.documentId}>
            
            {/* <Card
              hoverable
              cover={
                hinge.image?.url ? 
                <img 
                  alt={hinge.title} 
                  // src={`https://dev.api.boki-groupe.com${hinge.image.url}`} 
                  src={`${baseUrl}${hinge.image.url}`} 
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
            </Card> */}

            <Card
              hoverable={!hinge.archive}
              cover={
                <div style={{ position: 'relative' }}>
                  {hinge.image?.url ? (
                    <img
                      alt={hinge.title}
                      // src={`https://dev.api.boki-groupe.com${hinge.image.url}`}
                      src={`${baseUrl}${hinge.image.url}`} 
                      style={{ height: 200, objectFit: 'cover', width: '100%' }}
                    />
                  ) : (
                    <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {translations.noImages}
                    </div>
                  )}
                  {hinge.archive && <ArchiveOverlay text={translations.notAvailable} />}
                </div>
              }
              onClick={() => {
                if (!hinge.archive) onHingeSelect(hinge);
              }}
              style={{
                border: selectedHinge?.documentId === hinge.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0',
                cursor: hinge.archive ? 'not-allowed' : 'pointer',
                position: 'relative'
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
