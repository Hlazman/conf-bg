import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Typography, Spin, Button, message, Input, Form, Space, Modal } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import FileUploader from "./FileUploader";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const { Title, Text } = Typography;

// GraphQL запросы
const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) {
      documentId
      customTitle
      customImage {
        url
        documentId
      }
      productCostNetto
      amount
    }
  }
`;

const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) {
      documentId
      customTitle
      customImage {
        url
        documentId
      }
      productCostNetto
      amount
    }
  }
`;

const DELETE_SUBORDER_PRODUCT = gql`
  mutation DeleteSuborderProduct($documentId: ID!) {
    deleteSuborderProduct(documentId: $documentId) {
      documentId
    }
  }
`;

const GET_SUBORDER_PRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      customTitle
      customImage {
        url
        documentId
      }
      productCostNetto
      amount
    }
  }
`;

const KnobSelection = ({ suborderId, selectedKnob, onKnobSelect, onAfterSubmit }) => {
  const [form] = Form.useForm();
  const [knobProductId, setKnobProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customImageId, setCustomImageId] = useState(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [productCostNetto, setProductCostNetto] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [amount, setAmount] = useState(1);
  const { translations } = useContext(LanguageContext);

  const { currency, convertToEUR, convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Получаем данные о существующей ручке для подзаказа
  const { data: knobProductData, loading: loadingKnobProduct, refetch: refetchKnob } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "knob"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для создания ручки
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      message.success(translations.dataSaved);
      setSaving(false);
      refetchKnob();
    },
    onError: (error) => {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для обновления ручки
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      setSaving(false);
      refetchKnob();
    },
    onError: (error) => {
      message.error(`${translations.editError}: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для удаления ручки
  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(`${translations.knob} ${translations.removed}`);
      setDeleting(false);
      setKnobProductId(null);
      setCustomTitle("");
      setCustomImageId(null);
      setCustomImageUrl("");
      setProductCostNetto("");
      form.resetFields();
      refetchKnob();
    },
    onError: (error) => {
      message.error(`${translations.deleteError}: ${error.message}`);
      setDeleting(false);
    }
  });

  // Загружаем данные существующей ручки при загрузке компонента
  useEffect(() => {
    if (!loadingKnobProduct && knobProductData) {
      if (knobProductData.suborderProducts && knobProductData.suborderProducts.length > 0) {
        const knobProduct = knobProductData.suborderProducts[0];
        setKnobProductId(knobProduct.documentId);
        setCustomTitle(knobProduct.customTitle || "");
        // setProductCostNetto(knobProduct.productCostNetto || "");
        setProductCostNetto(convertFromEUR(knobProduct.productCostNetto) || "");
        setAmount(knobProduct.amount || 1);
        
        if (knobProduct.customImage) {
          setCustomImageId(knobProduct.customImage.documentId);
          // setCustomImageUrl(knobProduct.customImage.url);

           // Проверяем формат URL и добавляем базовый URL, если путь относительный
          const imageUrl = knobProduct.customImage.url;
          if (imageUrl && imageUrl.startsWith('/')) {
            const baseUrl = 'https://dev.api.boki-groupe.com';
            setCustomImageUrl(baseUrl + imageUrl);
          } else {
            setCustomImageUrl(imageUrl);
          }
        }

        form.setFieldsValue({
          customTitle: knobProduct.customTitle || "",
          // productCostNetto: knobProduct.productCostNetto || "",
          productCostNetto: convertFromEUR(knobProduct.productCostNetto) || "",
          amount: knobProduct.amount || 1 // Добавить в форму
        });
      }
    }
  // }, [knobProductData, loadingKnobProduct, form]);
  }, [knobProductData, loadingKnobProduct, form, convertFromEUR]);

  // Обработчик загрузки файла
  const handleFileUploaded = (file) => {
    setCustomImageId(file.id);
    setCustomImageUrl(file.url);
  };

  const handleSave = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }
  
    try {
      await form.validateFields();
    } catch (error) {
      return;
    }
  
    setSaving(true);
  
    try {
      const formValues = form.getFieldsValue();
      
      const knobData = {
        suborder: suborderId,
        type: "knob",
        customTitle: formValues.customTitle,
        // productCostNetto: parseFloat(formValues.productCostNetto),
        productCostNetto: convertToEUR(parseFloat(formValues.productCostNetto)),
        amount: parseInt(formValues.amount, 10) || 1
      };
  
      const isNewImageUploaded = document.querySelector('.ant-upload-list-item') !== null;
      
      if (!knobProductId && customImageId) {
        knobData.customImage = customImageId;
      } else if (knobProductId && isNewImageUploaded && customImageId) {
        knobData.customImage = customImageId;
      }
  
      if (knobProductId) {
        await updateSuborderProduct({
          variables: {
            documentId: knobProductId,
            data: knobData
          }
        });
      } else {
        await createSuborderProduct({
          variables: {
            data: knobData
          }
        });
      }

      // Update title in collapse
      if (onAfterSubmit) {
        await onAfterSubmit();
      }

    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };
  

  // Обработчик удаления ручки
  const handleDelete = async () => {
    if (!knobProductId) {
      message.error(translations.noData);
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setShowDeleteConfirm(false);
    
    try {
      await deleteSuborderProduct({
        variables: {
          documentId: knobProductId
        }
      });
    } catch (error) {
      message.error(`${translations.deleteError}: ${error.message}`);
      setDeleting(false);
    }
  };

  if (loadingKnobProduct) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
        <p>{translations.loading}</p>
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: "20px" }}>
        <Col>
          <Title level={4}>{translations.selection} {translations.knob}</Title>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              onClick={handleSave} 
              loading={saving}
              style={!knobProductId? {} : { backgroundColor: '#52C41A' }}
            >
              {knobProductId ? translations.update : translations.save}
            </Button>
            
            {knobProductId && (
              <Button 
                danger 
                onClick={handleDelete} 
                loading={deleting}
              >
                {translations.delete}
              </Button>
            )}
          </Space>
        </Col>
      </Row>
      
      <Form form={form} layout="vertical" initialValues={{ customTitle: "", productCostNetto: "" }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="customTitle"
              label={translations.title}
              rules={[{ required: true, message: translations.enterTitle }]}
            >
              <Input 
                placeholder={translations.enterTitle} 
                onChange={(e) => setCustomTitle(e.target.value)} 
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="productCostNetto"
              label={`${translations.price} (Netto)`}
              rules={[{ required: true, message: translations.enterPrice }]}
            >
              <Input 
                type="number" 
                placeholder={translations.enterPrice} 
                onChange={(e) => setProductCostNetto(e.target.value)}
                addonAfter={getCurrencySymbol()} 
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="amount"
              label={translations.amount}
              rules={[{ required: true, message: translations.enterAmount }]}
            >
              <Input 
                type="number" 
                placeholder={translations.amount} 
                min={1}
                onChange={(e) => setAmount(e.target.value)} 
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item label={translations.image}>
          <div style={{ marginBottom: "10px" }}>
            {customImageUrl && (
              <div style={{ marginBottom: "10px" }}>
                <img 
                  src={customImageUrl} 
                  alt="knob" 
                  style={{ maxWidth: "100%", maxHeight: "200px" }} 
                />
              </div>
            )}
            <FileUploader onFileUploaded={handleFileUploaded} />
          </div>
        </Form.Item>
      </Form>
      
      <Modal
        title={translations.confirmDel}
        open={showDeleteConfirm}
        onOk={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        okText={translations.delete}
        cancelText={translations.cancel}
      >
        <p>{translations.sureToDel}</p>
      </Modal>
    </div>
  );
};

export default KnobSelection;
