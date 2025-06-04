import React, { useState, useEffect, useContext, useMemo } from "react";
import { Row, Col, Form, Radio, InputNumber, Select, Divider, Spin, Button, message, Typography, Modal, Checkbox } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

const { Title } = Typography;
const { Option } = Select;

// Мутация для обновления SuborderProduct
const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) {
      documentId
      frameTreshold
      sizes {
        holeWidth
        holeHeight
        blockWidth
        blockHeight
        height
        length
        thickness
        type
        width
      }
    }
  }
`;

// Запрос для получения существующего SuborderProduct
const GET_SUBORDER_PRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      frameTreshold
      amount
      doorSeal
      knobInsertion
      lockInsertion
      spindleInsertion
      thresholdInsertion
      sizes {
        height
        width
        thickness
        type
        length
        holeWidth
        holeHeight
        blockWidth
        blockHeight
      }
      type
    }
  }
`;

const GET_FRAME_PRODUCT = gql`
  query GetFrameProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      product {
        documentId
        title
        maxSizes {
          deltaWidth
          deltaHeight
        }
        collections { 
          documentId
          title 
        }
        description
        guarantee
        brand
        description
        image {
          documentId
          url
        }
        type
      }
    }
  }
`;

const DoorParameters = ({ selectedDoor, onParametersChange, suborderId, onAfterSubmit }) => {
  const [suborderProductId, setSuborderProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  const doorType = localStorage.getItem('currentType');
  const { translations } = useContext(LanguageContext);

  // Размеры
  const [dimensionType, setDimensionType] = useState("door");
  const [doorHeight, setDoorHeight] = useState();
  const [doorWidth, setDoorWidth] = useState();
  const [wallThickness, setWallThickness] = useState();
  const [doorQuantity, setDoorQuantity] = useState(1);

  // Врезка и уплотнение
  const [handleCutout, setHandleCutout] = useState(false);
  const [boltCutout, setBoltCutout] = useState(false);
  const [thresholdCutout, setThresholdCutout] = useState(false);
  // const [doorSeal, setDoorSeal] = useState("none");
  const [doorSeal, setDoorSeal] = useState();
  const [lockCutout, setLockCutout] = useState(false);

  // Дополнительные размеры для стены
  const [holeWidth, setHoleWidth] = useState(-1);
  const [holeHeight, setHoleHeight] = useState(-1);

  // Добавляем состояние для frameTreshold
  const [frameTreshold, setFrameTreshold] = useState(false);
  // Состояние для отслеживания, было ли уже применено изменение
  const [tresholdAdjustmentApplied, setTresholdAdjustmentApplied] = useState(false);
  // Состояние для отслеживания изменений высоты
  const [heightModified, setHeightModified] = useState(false);

  // Запрос на получение существующего SuborderProduct
  const { data: suborderProductData, loading: loadingSuborderProduct } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          // eq: "door"
          eq: doorType
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Запрос на получение существующего frame из SuborderProduct
  const { data: frameProductData } = useQuery(GET_FRAME_PRODUCT, {
    variables: {
      filters: {
        suborder: { documentId: { eq: suborderId } },
        type: { eq: "frame" }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      setSaving(false);
    },
    onError: (error) => {
      // message.error(`${translations.err}: ${error.message}`);
          message.error(`${translations.err}: ${error.message === "2 errors occurred" ? (translations["2 errors occurred"]) : error.message}`);
      setSaving(false);
    }
  });

  // Объединенная инициализация данных из suborderProduct
  useEffect(() => {
    if (!loadingSuborderProduct && suborderProductData?.suborderProducts?.[0]) {
      const suborderProduct = suborderProductData.suborderProducts[0];
      
      // Основные параметры
      setSuborderProductId(suborderProduct.documentId);
      setDoorQuantity(suborderProduct.amount || 1);
      
      // Размеры
      if (suborderProduct.sizes) {
        const { height, width, thickness, type, holeWidth, holeHeight } = suborderProduct.sizes;
        setDoorHeight(height);
        setDoorWidth(width);
        setWallThickness(thickness);
        setDimensionType(type || "door");
        setHoleWidth(holeWidth ?? -1);
        setHoleHeight(holeHeight ?? -1);
      }
      
      // Врезки и уплотнение
      setHandleCutout(suborderProduct.knobInsertion || false);
      setLockCutout(suborderProduct.lockInsertion || false);
      setBoltCutout(suborderProduct.spindleInsertion || false);
      setThresholdCutout(suborderProduct.thresholdInsertion || false);
      // setDoorSeal(suborderProduct.doorSeal || "none");
      setDoorSeal(suborderProduct.doorSeal);
      setFrameTreshold(suborderProduct.frameTreshold || false); // frameTreshold
    }
  }, [suborderProductData, loadingSuborderProduct]);

  // Отслеживаем изменения высоты (frameTreshold)
  useEffect(() => {
    if (doorHeight || holeHeight) {
      setHeightModified(true);
      // Сбрасываем флаг применения корректировки при изменении высоты
      setTresholdAdjustmentApplied(false);
    }
  }, [doorHeight, holeHeight]);

  // Обработка данных рамы
  const frameProduct = useMemo(() => 
    frameProductData?.suborderProducts?.[0] || null,
    [frameProductData]
  );

  // Вычисление размеров проема/двери
  const frameSizes = useMemo(() => frameProduct?.product?.maxSizes?.[0], [frameProduct]);

  useEffect(() => {
    if (!frameSizes) return;
    
    const { deltaWidth, deltaHeight } = frameSizes;
    
    if (dimensionType === "door") {
      setHoleWidth(doorWidth + deltaWidth);
      setHoleHeight(doorHeight + deltaHeight);
    } else {
      setDoorWidth(holeWidth - deltaWidth);
      setDoorHeight(holeHeight - deltaHeight);
    }
  }, [doorWidth, doorHeight, holeWidth, holeHeight, dimensionType, frameSizes]);

  // Вычисление размеров блока через useMemo
  const [blockWidth, blockHeight] = useMemo(() => [
    holeWidth != null ? holeWidth - 24 : -1,
    holeHeight != null ? holeHeight - 12 : -1
  ], [holeWidth, holeHeight]);

  // Функция для обработки изменения frameTreshold
  const handleFrameTresholdChange = (e) => {
    const value = e.target.value;
    
    // Если выбрано false (No), просто отменяем без уведомления
    if (!value) {
      // Если корректировка была применена, возвращаем исходные значения
      if (tresholdAdjustmentApplied) {
        const adjustmentValue = selectedDoor?.type === "hiddenDoor" ? 25 : 30;
        setDoorHeight(prev => prev + adjustmentValue);
        setHoleHeight(prev => prev - adjustmentValue);
        setTresholdAdjustmentApplied(false);
      }
      setFrameTreshold(false);
      return;
    }
    
    // Проверяем, есть ли все необходимые данные (только для true)
    if (doorHeight && doorWidth && holeWidth !== -1 && holeHeight !== -1) {
      // Определяем значение корректировки в зависимости от типа двери
      const adjustmentValue = selectedDoor?.type === "hiddenDoor" ? 25 : 30;
      
      // Показываем модальное окно с подтверждением
      Modal.confirm({
        title: translations.confirmation,
        content: `${translations.minusHeight} ${adjustmentValue} mm.`,
        cancelText: translations.cancel,
        onOk: () => {
          setFrameTreshold(true);
          if (!tresholdAdjustmentApplied) {
            // Применяем изменения только если они еще не были применены
            setDoorHeight(prev => prev - adjustmentValue);
            // Обновляем holeHeight, чтобы вызвать пересчет blockHeight через useMemo
            setHoleHeight(prev => prev + adjustmentValue);
            setTresholdAdjustmentApplied(true);
          }
        },
        onCancel: () => {
          setFrameTreshold(false);
        }
      });
    } else {
      message.warning(translations.fillSizesFirst);
      setFrameTreshold(false);
    }
  };

  //Параметры для родителя через useMemo + useEffect
  const parameters = useMemo(() => ({
    dimensionType,
    doorHeight,
    doorWidth,
    wallThickness,
    doorQuantity,
    handleCutout,
    boltCutout,
    thresholdCutout,
    doorSeal,
    lockCutout,
    frameTreshold // frameTreshold
  }), [
    dimensionType, doorHeight, doorWidth, wallThickness, 
    doorQuantity, handleCutout, boltCutout, thresholdCutout, 
    doorSeal, lockCutout, frameTreshold // frameTreshold
  ]);

  useEffect(() => {
    onParametersChange?.(parameters);
  }, [parameters, onParametersChange]);

  // Мемоизация максимальных значений параметров.
  const maxSizes = useMemo(() => selectedDoor?.maxSizes || [], [selectedDoor]);

  // Валтдация максимальных значений высоты и ширины
  const validateMaxSizes = (height, width) => {
    if (!maxSizes || maxSizes.length === 0) return true; // Если нет ограничений
    return maxSizes.some(size => height <= size.height && width <= size.width);
  };

  // Обработчики изменения параметров
  const handleDimensionTypeChange = (e) => {
    setDimensionType(e.target.value);
  };

  // Функция сохранения параметров двери
  const handleSaveParameters = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }

    if (!suborderProductId) {
      message.error(translations.firstDoor);
      return;
    }

    // Проверка максимальных размеров
    if (!validateMaxSizes(doorHeight, doorWidth)) {
      const sizesList = maxSizes
        .map(size => `${size.height}x${size.width}`)
        .join(', ');
        
      message.error(
        `${translations.maxSizes}: ${sizesList}`,
        5 // Увеличиваем длительность показа
      );
      return;
    }

    if (!doorHeight) {
      message.error(translations.enterHeight);
      return;
    }

    if (!doorWidth) {
      message.error(translations.enterWidth);
      return;
    }

    if (!wallThickness && dimensionType === "wall") {
      message.error(translations.enterThickness);
      return;
    }

    if (!doorSeal) {
      message.error(translations.doorSealRequired);
      return;
    }
    
    setSaving(true);

    const parameterData = {
      amount: doorQuantity,
      // doorSeal: doorSeal !== "none" ? doorSeal : null,
      doorSeal: doorSeal,
      knobInsertion: handleCutout,
      lockInsertion: lockCutout,
      spindleInsertion: boltCutout,
      thresholdInsertion: thresholdCutout,
      frameTreshold: frameTreshold, // frameTreshold
      sizes: {
        height: doorHeight,
        width: doorWidth,
        thickness: wallThickness,
        type: dimensionType,
        holeWidth: holeWidth !== -1 ? holeWidth : null, 
        holeHeight: holeHeight !== -1 ? holeHeight : null,
        blockWidth: blockWidth !== -1 ? blockWidth : null,
        blockHeight: blockHeight !== -1 ? blockHeight : null 
      },
      type: doorType
    };

    // Обновляем существующий SuborderProduct
    await updateSuborderProduct({
      variables: {
        documentId: suborderProductId,
        data: parameterData
      }
    });

    // Update title in collapse
    if (onAfterSubmit) {
      await onAfterSubmit();
    }
  };

  if (loadingSuborderProduct) return <Spin size="large" />;

  if (!selectedDoor && !suborderProductId) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Title level={4}>{translations.firstDoor}</Title>
      </div>
    );
  }

  return (
    <div>
      <Divider orientation="left">{translations.doorParameters}</Divider> 
      <div style={{ marginBottom: 32, marginTop: -45, display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
        <Button 
          type="primary" 
          onClick={handleSaveParameters} 
          loading={saving}
          disabled={!suborderProductId}
          style={!doorHeight ? {} : { backgroundColor: '#52C41A' }}
        >
          {doorHeight? translations.update : translations.save}
        </Button>
      </div>
      
      <Form>
        {/* Размеры */}
        <Divider orientation="left">{translations.sizes}</Divider>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item label={translations.type}>
              <Radio.Group
                value={dimensionType}
                onChange={handleDimensionTypeChange}
              >
                <Radio value="door">{translations.canvasSize}</Radio>
                <Radio value="wall">{translations.wallSize}</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>

          <Col span={dimensionType === "door" ? 12 : 8}>
            <Form.Item label={translations.height} required>
              {dimensionType === "wall" ? (
                <>
                  <InputNumber
                    min={1}
                    value={holeHeight}
                    onChange={val => {
                      setHoleHeight(val);
                      if (frameProduct?.product?.maxSizes?.[0]) {
                        setDoorHeight(val - frameProduct.product.maxSizes[0].deltaHeight);
                      }
                    }}
                    style={{ width: "100%" }}
                    addonBefore={translations.holeHeight}
                    addonAfter={'mm'}
                    readOnly={false}
                  />
                  <InputNumber
                    value={doorHeight}
                    readOnly
                    style={{ marginTop: 8, width: "100%" }}
                    addonBefore={`${translations.doorCanvas} ${translations.height}`}
                    addonAfter={'mm'}
                  />
                  <InputNumber
                    value={blockHeight}
                    readOnly
                    style={{ marginTop: 8, width: "100%" }}
                    addonBefore={translations.blockHeight}
                    addonAfter={'mm'}
                  />
                </>
              ) : (
                <>
                  <InputNumber
                    min={1}
                    value={doorHeight}
                    onChange={val => {
                      setDoorHeight(val);
                      if (frameProduct?.product?.maxSizes?.[0]) {
                        setHoleHeight(val + frameProduct.product.maxSizes[0].deltaHeight);
                      }
                    }}
                    style={{ width: "100%" }}
                    addonBefore={`${translations.doorCanvas} ${translations.height}`}
                    addonAfter={'mm'}
                    readOnly={false}
                  />
                  <InputNumber
                    value={holeHeight}
                    readOnly
                    style={{ marginTop: 8, width: "100%" }}
                    addonBefore={translations.holeHeight}
                    addonAfter={'mm'}
                  />
                  <InputNumber
                    value={blockHeight}
                    readOnly
                    style={{ marginTop: 8, width: "100%" }}
                    addonBefore={translations.blockHeight}
                    addonAfter={'mm'}
                  />
                </>
              )}
            </Form.Item>
          </Col>

          <Col span={dimensionType === "door" ? 12 : 8}>
            <Form.Item label={translations.width} required>
              {dimensionType === "wall" ? (
                <>
                  <InputNumber
                    min={1}
                    value={holeWidth}
                    onChange={val => {
                      setHoleWidth(val);
                      if (frameProduct?.product?.maxSizes?.[0]) {
                        setDoorWidth(val - frameProduct.product.maxSizes[0].deltaWidth);
                      }
                    }}
                    style={{ width: "100%" }}
                    addonBefore={translations.holeWidth}
                    addonAfter={'mm'}
                    readOnly={false}
                  />
                  <InputNumber
                    value={doorWidth}
                    readOnly
                    style={{ marginTop: 8, width: "100%" }}
                    addonBefore={`${translations.doorCanvas} ${translations.width}`}
                    addonAfter={'mm'}
                  />
                  <InputNumber
                    value={blockWidth}
                    readOnly
                    style={{ marginTop: 8, width: "100%" }}
                    addonBefore={translations.blockWidth}
                    addonAfter={'mm'}
                  />
                </>
              ) : (
                <>
                  <InputNumber
                    min={1}
                    value={doorWidth}
                    onChange={val => {
                      setDoorWidth(val);
                      if (frameProduct?.product?.maxSizes?.[0]) {
                        setHoleWidth(val + frameProduct.product.maxSizes[0].deltaWidth);
                      }
                    }}
                    style={{ width: "100%" }}
                    addonBefore={`${translations.doorCanvas} ${translations.width}`}
                    addonAfter={'mm'}
                    readOnly={false}
                  />
                  <InputNumber
                    value={holeWidth}
                    readOnly
                    style={{ marginTop: 8, width: "100%" }}
                    addonAfter={'mm'}
                    addonBefore={translations.holeWidth}
                  />

                  <InputNumber
                    value={blockWidth}
                    readOnly
                    style={{ marginTop: 8, width: "100%" }}
                    addonBefore={translations.blockWidth}
                    addonAfter={'mm'}
                  />
                </>
              )}
            </Form.Item>
          </Col>

          {dimensionType === "wall" && (
            <Col span={8}>
              <Form.Item label={translations.thickness} required>
                <InputNumber
                  value={wallThickness}
                  onChange={setWallThickness}
                  style={{ width: "100%" }}
                  addonAfter={'mm'}
                />
              </Form.Item>
            </Col>
          )}
          <Col span={8}>
            <Form.Item label={translations.amount}>
              <InputNumber
                min={1}
                max={100}
                value={doorQuantity}
                onChange={setDoorQuantity}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Добавляем чекбокс для frameTreshold */}
        <Divider orientation="left">{translations.frameTreshold}</Divider>
        {/* <Form.Item label={translations.frameTreshold || "Порог рамы"}>
          <Checkbox 
            checked={frameTreshold}
            onChange={(e) => handleFrameTresholdChange(e.target.checked)}
            disabled={
              selectedDoor?.type === "door" && 
              !frameProductData?.suborderProducts?.length
            }
          />
        </Form.Item> */}
          
        <Form.Item style={{marginBottom: '50px'}} label={translations.treshold}>
          <Radio.Group
          buttonStyle="solid"
            value={frameTreshold} 
            onChange={handleFrameTresholdChange}
            disabled={
              selectedDoor?.type === "door" && 
              !frameProductData?.suborderProducts?.length
            }
          >
            <Radio.Button value={false}>{translations.no}</Radio.Button>
            <Radio.Button value={true}>{translations.yes}</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Врезка и уплотнение */}
        <Divider orientation="left">{translations.tapSeal}</Divider>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Form.Item label={translations.handleInsert} style={{ marginBottom: 0 }}>
              <Radio.Group
                value={handleCutout}
                onChange={(e) => setHandleCutout(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value={false}>{translations.no}</Radio.Button>
                <Radio.Button value={true}>{translations.yes}</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label={translations.mortiseLock} style={{ marginBottom: 0 }}>
              <Radio.Group
                value={lockCutout}
                onChange={(e) => setLockCutout(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value={false}>{translations.no}</Radio.Button>
                <Radio.Button value={true}>{translations.yes}</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label={translations.lbInsert} style={{ marginBottom: 0 }}>
              <Radio.Group
                value={boltCutout}
                onChange={(e) => setBoltCutout(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value={false}>{translations.no}</Radio.Button>
                <Radio.Button value={true}>{translations.yes}</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label={translations.thresholdInsert} style={{ marginBottom: 0 }}>
              <Radio.Group
                value={thresholdCutout}
                onChange={(e) => setThresholdCutout(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value={false}>{translations.no}</Radio.Button>
                <Radio.Button value={true}>{translations.yes}</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Col span={8}>
            <Form.Item label={translations.doorSeal} required>
              <Select
                value={doorSeal}
                onChange={setDoorSeal}
                style={{ width: "100%" }}
              >
                <Option value="brown">{translations.brown}</Option>
                <Option value="black">{translations.black}</Option>
                <Option value="white">{translations.white}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default DoorParameters;

