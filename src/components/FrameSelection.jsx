import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Spin, Empty, Button, message, Divider, Typography, Checkbox, Tabs } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import DecorSelection from './DecorSelection';
import ArchiveOverlay from './ArchiveOverlay';

const { Title  } = Typography;

const GET_FRAMES = gql`
  query GetFrames($filters: ProductFiltersInput, $pagination: PaginationArg) {
    products(filters: $filters, pagination: $pagination) {
      documentId
      archive
      description
      title
      type
      image {
        url
      }
      compatibleHiddenFrames {
        documentId
      }
      compatibleSimpleFrames {
        documentId
      }
      collections {
        documentId
        title
      }
    }
  }
`;

// Мутация для создания SuborderProduct
const CREATE_SUBORDER_PRODUCT = gql`
mutation CreateSuborderProduct($data: SuborderProductInput!) {
  createSuborderProduct(data: $data) {
    documentId
    framePainting
  }
}`;

// Мутация для обновления SuborderProduct
const UPDATE_SUBORDER_PRODUCT = gql`
mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
  updateSuborderProduct(documentId: $documentId, data: $data) {
    documentId
    framePainting
  }
}`;

// Запрос для получения существующего SuborderProduct
const GET_SUBORDER_PRODUCT = gql`
query GetSuborderProduct($filters: SuborderProductFiltersInput) {
  suborderProducts(filters: $filters) {
    documentId
    framePainting
    decor {
      documentId
      title
    }
    decor_type {
      documentId
      typeName
    }
    secondSideDecor {
      documentId
      title
    }
    secondSideDecorType {
      documentId
      typeName
    }
    colorCode
    secondSideColorCode
    product {
      compatibleHiddenFrames {
        documentId
      }
      compatibleSimpleFrames {
        documentId
      }
      documentId
      title
      brand
      image {
        documentId
        url
      }
      maxSizes {
        height
        width
      }
      collections { 
        documentId
        title 
      }
      description
      guarantee
      type
    }
    type
  }
}`;

const FrameSelection = ({
  doorId,
  collectionId,
  selectedFrame,
  onFrameSelect,
  suborderId, 
  onAfterSubmit
}) => {
  const [frameProductId, setFrameProductId] = useState(null);
  const [framePainting, setFramePainting] = useState(false);
  const [saving, setSaving] = useState(false);
  const { translations } = useContext(LanguageContext);
  const doorType = localStorage.getItem('currentType');
  const [activeTab, setActiveTab] = useState("1");

  // Состояние для лицевой стороны декора
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");

  // Запрос для получения рам
  const { loading, error, data } = useQuery(GET_FRAMES, {
    variables: {
      filters: {
        type: {
          eqi: "frame"
        },
        ...(doorType === "hiddenDoor" 
          ? {
              compatibleHiddenFrames: {
                documentId: {
                  eq: doorId
                }
              }
            }
          : doorType === "door" 
          ? {
              compatibleSimpleFrames: {
                documentId: {
                  eq: doorId
                }
              }
            }
          : {}
        )
      },
      pagination: { limit: 20 },
    },
    skip: !doorId || (!doorType)
  });

  
  // Запрос для получения существующего SuborderProduct типа frame
  const { data: frameProductData, loading: loadingFrameProduct, refetch: refetchFrame } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "frame"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для создания SuborderProduct
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      message.success(translations.dataSaved);
      setSaving(false);
      refetchFrame();
      // refetchThreshold();
    },
    onError: (error) => {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      setSaving(false);
      refetchFrame();
    },
    onError: (error) => {
      message.error(`${translations.editError}: ${error.message}`);
      setSaving(false);
    }
  });

  const frames = useMemo(() => {
    if (!data?.products) return [];
    
    // Теперь все рамы уже отфильтрованы на уровне запроса
    return data.products;
  }, [data]);

  // Функция для определения типов декора, для которых нужно показывать ColorPicker
  const isPaintType = (typeName) => {
    return typeName && (
      typeName === "Paint" ||
      typeName === "Paint glass" ||
      typeName === "Paint veneer"
    );
  };

  // Эффект для загрузки данных при изменении frames
  useEffect(() => {
    if (!loadingFrameProduct && frameProductData && frames.length > 0) {
      if (frameProductData.suborderProducts && frameProductData.suborderProducts.length > 0) {
        const frameProduct = frameProductData.suborderProducts[0];
        setFrameProductId(frameProduct.documentId);

        // Загружаем значение framePainting
        setFramePainting(frameProduct.framePainting || false);

        // Устанавливаем декор и тип декора для лицевой стороны
        if (frameProduct.decor_type) {
          setSelectedFrontDecorType(frameProduct.decor_type);
        }
        if (frameProduct.decor) {
          setSelectedFrontDecor(frameProduct.decor);
        }
        if (frameProduct.colorCode) {
          setFrontColorCode(frameProduct.colorCode);
        }
        
        // Если есть продукт и пользователь еще не выбрал раму, устанавливаем её
        if (frameProduct.product && !selectedFrame) {
          const frameFromProducts = frames.find(frame =>
            frame.documentId === frameProduct.product.documentId
          );
          if (frameFromProducts) {
            onFrameSelect(frameFromProducts);
          }
        }
      }
    }
  }, [frames, frameProductData, loadingFrameProduct, onFrameSelect, selectedFrame]);

  // Эффект для сброса декора при выборе покраски
  useEffect(() => {
    if (framePainting) {
      // Сбрасываем выбранный декор при включении покраски
      setSelectedFrontDecorType(null);
      setSelectedFrontDecor(null);
      setFrontColorCode("");
    }
  }, [framePainting]);

  // Эффект для сброса покраски при выборе декора
  useEffect(() => {
    if (selectedFrontDecor || selectedFrontDecorType) {
      // Сбрасываем покраску при выборе декора
      setFramePainting(false);
    }
  }, [selectedFrontDecor, selectedFrontDecorType]);


  // Функция сохранения выбранной рамы и порога
  const handleSave = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }

    setSaving(true);

    try {
      // Сохраняем раму, если она выбрана
      if (selectedFrame) {
        const frameData = {
          suborder: suborderId,
          product: selectedFrame.documentId,
          type: "frame",
          framePainting: framePainting, // Добавляем поле framePainting
          // Если выбрана покраска, устанавливаем декор в null
          decor: framePainting ? null : (selectedFrontDecor ? selectedFrontDecor.documentId : null),
          decor_type: framePainting ? null : (selectedFrontDecorType ? selectedFrontDecorType.documentId : null),
          colorCode: framePainting ? null : (isPaintType(selectedFrontDecorType?.typeName) ? frontColorCode : null),
          // decor: selectedFrontDecor ? selectedFrontDecor.documentId : null,
          // decor_type: selectedFrontDecorType ? selectedFrontDecorType.documentId : null,
          // colorCode: isPaintType(selectedFrontDecorType?.typeName) ? frontColorCode : null,
        };

        if (frameProductId) {
          // Обновляем существующий SuborderProduct
          await updateSuborderProduct({
            variables: {
              documentId: frameProductId,
              data: frameData
            }
          });
        } else {
          // Создаем новый SuborderProduct
          await createSuborderProduct({
            variables: {
              data: frameData
            }
          });
        }
      }

      // Update title in collapse
      if (onAfterSubmit) {
        await onAfterSubmit();
      }

      message.success(translations.dataSaved);
      setSaving(false);
      
      // Обновляем данные
      refetchFrame();
    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingFrameProduct) return <Spin size="large" />;
  if (error) return <Empty description={translations.loadError} />;
  if (frames.length === 0) return <Empty description={translations.noData} />;

  const items = [
    {
      key: "1",
      label: translations.frame,
      children: (
        <div>

          {/* {selectedFrame && (
            <div style={{ margin: "20px 0" }}>
              <Checkbox 
                checked={framePainting}
                onChange={(e) => setFramePainting(e.target.checked)}
              >
                {translations.framePainting || "Покраска рамы"}
              </Checkbox>
            </div>
          )} */}

          <Row gutter={[16, 16]}>
            
            {/* {frames.map(frame => (
              <Col xs={24} sm={12} md={8} lg={6} key={frame.documentId}>
                <Card
                  hoverable
                  style={{ 
                    borderColor: selectedFrame?.documentId === frame.documentId ? '#1890ff' : undefined,
                    borderWidth: selectedFrame?.documentId === frame.documentId ? '2px' : '1px'
                  }}
                  styles={{ body: { padding: '12px' } }}
                  onClick={() => onFrameSelect(frame)}
                >
                  <Card.Meta 
                    title={
                      <Title level={5} style={{ whiteSpace: 'normal', wordBreak: 'break-word', padding: '20px' }}>
                        {translations[frame.title]}
                      </Title >
                    }
                  />           
                </Card>
              </Col>
            ))} */}

            {frames.map(frame => (
              <Col xs={24} sm={12} md={8} lg={6} key={frame.documentId}>
                <Card
                  hoverable={!frame.archive}
                  onClick={() => {
                    if (!frame.archive) {
                      onFrameSelect(frame);
                    }
                  }}
                  style={{ 
                    borderColor: selectedFrame?.documentId === frame.documentId ? '#1890ff' : undefined,
                    borderWidth: selectedFrame?.documentId === frame.documentId ? '2px' : '1px',
                    cursor: frame.archive ? 'not-allowed' : 'pointer',
                    position: 'relative'
                  }}
                  styles={{ body: { padding: '12px' } }}
                >
                  <Card.Meta 
                    title={
                      <Title level={5} style={{ whiteSpace: 'normal', wordBreak: 'break-word', padding: '20px', margin: 0 }}>
                        {translations[frame.title] || frame.title}
                      </Title>
                    }
                  />
                  {frame.archive && <ArchiveOverlay text={translations.notAvailable}/>}
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* {selectedFrame && (
            <div style={{ marginTop: 16 }}>
              <Checkbox 
                checked={framePainting}
                onChange={(e) => setFramePainting(e.target.checked)}
              >
                {translations.framePainting || "Покраска рамы"}
              </Checkbox>
            </div>
          )} */}
        </div>
      )
    },
    {
      key: "2",
      label: (
        <span>
          {translations.decorFront}
          <span style={{ color: '#00A651' }}>
            {selectedFrontDecorType ? ` - ${selectedFrontDecorType.typeName}` : ""}
            {selectedFrontDecor ? ` - ${selectedFrontDecor.title}` : ""}
            {selectedFrontDecorType && isPaintType(selectedFrontDecorType.typeName) && frontColorCode ? ` - ${frontColorCode}` : ""}
          </span>
        </span>
      ),
      disabled: !selectedFrame || framePainting, // Отключаем вкладку если выбрана покраска
      children: (
        <DecorSelection
          doorId={selectedFrame?.documentId}
          selectedDecorType={selectedFrontDecorType}
          selectedDecor={selectedFrontDecor}
          colorCode={frontColorCode}
          onDecorTypeSelect={setSelectedFrontDecorType}
          onDecorSelect={setSelectedFrontDecor}
          onColorChange={setFrontColorCode}
          isFrontSide={true}
          suborderId={suborderId}
          productType="frame"
          noNCS = {true}
        />
      )
    }
  ];

  return (
    <div>
      <Divider orientation="left">{translations.frame}</Divider> 

      <div style={{ marginBottom: 32, marginTop: -45, display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
        <Button 
          type="primary" 
          onClick={handleSave}
          loading={saving}
          disabled={!selectedFrame}
          style={{
            ...{ marginRight: 8 },
            ...(!frameProductId ? {} : { backgroundColor: '#52C41A' })
          }}
        >
          {frameProductId ? translations.update : translations.save}
        </Button>
        
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </div>
  );
};

export default FrameSelection;


