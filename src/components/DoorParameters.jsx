import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Form, Radio, InputNumber, Select, Divider, Spin, Button, message, Typography } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

const { Title } = Typography;
const { Option } = Select;

// Мутация для обновления SuborderProduct
const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) {
      documentId
    }
  }
`;

// Запрос для получения существующего SuborderProduct
const GET_SUBORDER_PRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
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
      }
      type
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
  const [doorSeal, setDoorSeal] = useState("none");
  const [lockCutout, setLockCutout] = useState(false);

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

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      setSaving(false);
    },
    onError: (error) => {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  });

  // Эффект для загрузки данных при получении suborderProductData
  useEffect(() => {
    if (!loadingSuborderProduct && suborderProductData) {
      if (suborderProductData.suborderProducts && suborderProductData.suborderProducts.length > 0) {
        const suborderProduct = suborderProductData.suborderProducts[0];
        setSuborderProductId(suborderProduct.documentId);
        
        // Заполняем состояние данными из suborderProduct
        if (suborderProduct.sizes) {
          setDoorHeight(suborderProduct.sizes.height);
          setDoorWidth(suborderProduct.sizes.width);
          setWallThickness(suborderProduct.sizes.thickness);
          setDimensionType(suborderProduct.sizes.type || "door");
        }
        
        setDoorQuantity(suborderProduct.amount || 1);
        setHandleCutout(suborderProduct.knobInsertion || false);
        setLockCutout(suborderProduct.lockInsertion || false);
        setBoltCutout(suborderProduct.spindleInsertion || false);
        setThresholdCutout(suborderProduct.thresholdInsertion || false);
        setDoorSeal(suborderProduct.doorSeal ? suborderProduct.doorSeal : "none");
      }
    }
  }, [suborderProductData, loadingSuborderProduct]);

  // Эффект для обновления параметров при выборе новой двери
  useEffect(() => {
    if (selectedDoor) {
      // Можно установить значения по умолчанию на основе выбранной двери
      if (selectedDoor.defaultHeight) {
        setDoorHeight(selectedDoor.defaultHeight);
      }
      if (selectedDoor.defaultWidth) {
        setDoorWidth(selectedDoor.defaultWidth);
      }
    }
  }, [selectedDoor]);

  // Эффект для отправки изменений параметров в родительский компонент
  useEffect(() => {
    if (onParametersChange) {
      const parameters = {
        dimensionType,
        doorHeight,
        doorWidth,
        wallThickness,
        doorQuantity,
        handleCutout,
        boltCutout,
        thresholdCutout,
        doorSeal,
        lockCutout
      };
      
      onParametersChange(parameters);
    }
  }, [
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
    onParametersChange
  ]);

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
    

    setSaving(true);

    const parameterData = {
      amount: doorQuantity,
      doorSeal: doorSeal !== "none" ? doorSeal : null,
      knobInsertion: handleCutout,
      lockInsertion: lockCutout,
      spindleInsertion: boltCutout,
      thresholdInsertion: thresholdCutout,
      sizes: {
        height: doorHeight,
        width: doorWidth,
        thickness: wallThickness,
        type: dimensionType
      },
      type: doorType // type: "door"
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>{translations.doorParameters}</Title>
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
              <InputNumber
                // min={1000}
                // max={3000}
                value={doorHeight}
                onChange={setDoorHeight}
                style={{ width: "100%" }}
                addonAfter={'mm'}
              />
            </Form.Item>
          </Col>
          <Col span={dimensionType === "door" ? 12 : 8}>
            <Form.Item label={translations.width} required>
              <InputNumber
                // min={500}
                // max={1500}
                value={doorWidth}
                onChange={setDoorWidth}
                style={{ width: "100%" }}
                addonAfter={'mm'}
              />
            </Form.Item>
          </Col>
          {dimensionType === "wall" && (
            <Col span={8}>
              <Form.Item label={translations.thickness} required>
                <InputNumber
                  // min={50}
                  // max={500}
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
            <Form.Item label={translations.doorSeal}>
              <Select
                value={doorSeal}
                onChange={setDoorSeal}
                style={{ width: "100%" }}
              >
                <Option value="none">{translations.no}</Option>
                <Option value="black">{translations.black}</Option>
                <Option value="grey">{translations.grey}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default DoorParameters;

