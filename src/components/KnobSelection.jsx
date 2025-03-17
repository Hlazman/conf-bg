import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Typography, Spin, Button, message, Input, Form, Space, Modal } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import FileUploader from "./FileUploader";
import { LanguageContext } from "../context/LanguageContext";

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

const KnobSelection = ({ suborderId, selectedKnob, onKnobSelect }) => {
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
      message.success("Ручка успешно добавлена");
      setSaving(false);
      refetchKnob();
    },
    onError: (error) => {
      message.error(`Ошибка при сохранении: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для обновления ручки
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Ручка успешно обновлена");
      setSaving(false);
      refetchKnob();
    },
    onError: (error) => {
      message.error(`Ошибка при обновлении: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для удаления ручки
  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Ручка успешно удалена");
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
      message.error(`Ошибка при удалении: ${error.message}`);
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
        setProductCostNetto(knobProduct.productCostNetto || "");
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
          productCostNetto: knobProduct.productCostNetto || "",
          amount: knobProduct.amount || 1 // Добавить в форму
        });
      }
    }
  }, [knobProductData, loadingKnobProduct, form]);

  // Обработчик загрузки файла
  const handleFileUploaded = (file) => {
    setCustomImageId(file.id);
    setCustomImageUrl(file.url);
  };
  // const handleFileUploaded = (file) => {
  //   setCustomImageId(file.documentId); // Используем documentId вместо id
    
  //   // Проверяем формат URL и добавляем базовый URL, если путь относительный
  //   if (file.url && file.url.startsWith('/')) {
  //     // Добавляем базовый URL к относительному пути
  //     const baseUrl = 'https://dev.api.boki-groupe.com';
  //     setCustomImageUrl(baseUrl + file.url);
  //   } else {
  //     setCustomImageUrl(file.url);
  //   }
  // };

  // Обработчик сохранения ручки
  // const handleSave = async () => {
  //   if (!suborderId) {
  //     message.error("ID подзаказа не найден");
  //     return;
  //   }

  //   try {
  //     await form.validateFields();
  //   } catch (error) {
  //     return;
  //   }

  //   setSaving(true);

  //   try {
  //     const formValues = form.getFieldsValue();
      
  //     const knobData = {
  //       suborder: suborderId,
  //       type: "knob",
  //       customTitle: formValues.customTitle,
  //       productCostNetto: parseFloat(formValues.productCostNetto),
  //       amount: parseInt(formValues.amount, 10) || 1
  //     };

  //     if (customImageId) {
  //       knobData.customImage = customImageId;
  //     }

  //     if (knobProductId) {
  //       await updateSuborderProduct({
  //         variables: {
  //           documentId: knobProductId,
  //           data: knobData
  //         }
  //       });
  //     } else {
  //       await createSuborderProduct({
  //         variables: {
  //           data: knobData
  //         }
  //       });
  //     }
  //   } catch (error) {
  //     message.error(`Произошла ошибка: ${error.message}`);
  //     setSaving(false);
  //   }
  // };

  const handleSave = async () => {
    if (!suborderId) {
      message.error("ID подзаказа не найден");
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
        productCostNetto: parseFloat(formValues.productCostNetto),
        amount: parseInt(formValues.amount, 10) || 1
      };
  
      // Добавляем изображение в запрос только если:
      // 1. Это новая ручка (knobProductId отсутствует) И есть customImageId
      // 2. Это обновление ручки И пользователь загрузил новое изображение
      
      // Флаг, указывающий, было ли загружено новое изображение в текущей сессии
      const isNewImageUploaded = document.querySelector('.ant-upload-list-item') !== null;
      
      if (!knobProductId && customImageId) {
        // Для новой ручки с изображением
        knobData.customImage = customImageId;
      } else if (knobProductId && isNewImageUploaded && customImageId) {
        // Для обновления ручки с новым изображением
        knobData.customImage = customImageId;
      }
      // В остальных случаях не включаем поле customImage в запрос,
      // чтобы сохранить существующее изображение
  
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
    } catch (error) {
      message.error(`Произошла ошибка: ${error.message}`);
      setSaving(false);
    }
  };
  

  // Обработчик удаления ручки
  const handleDelete = async () => {
    if (!knobProductId) {
      message.error("Ручка не найдена");
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
      message.error(`Произошла ошибка при удалении: ${error.message}`);
      setDeleting(false);
    }
  };

  if (loadingKnobProduct) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
        <p>Загрузка данных о ручке...</p>
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: "20px" }}>
        <Col>
          <Title level={4}>Выбор ручки</Title>
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
                Удалить
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
              label="Название ручки"
              rules={[{ required: true, message: "Пожалуйста, введите название ручки" }]}
            >
              <Input 
                placeholder="Введите название ручки" 
                onChange={(e) => setCustomTitle(e.target.value)} 
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="productCostNetto"
              label="Цена (Netto)"
              rules={[{ required: true, message: "Пожалуйста, введите цену" }]}
            >
              <Input 
                type="number" 
                placeholder="Введите цену" 
                onChange={(e) => setProductCostNetto(e.target.value)} 
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="amount"
              label="Количество"
              rules={[{ required: true, message: "Пожалуйста, укажите количество" }]}
            >
              <Input 
                type="number" 
                placeholder="Количество" 
                min={1}
                onChange={(e) => setAmount(e.target.value)} 
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item label="Изображение ручки">
          <div style={{ marginBottom: "10px" }}>
            {customImageUrl && (
              <div style={{ marginBottom: "10px" }}>
                <img 
                  src={customImageUrl} 
                  alt="Изображение ручки" 
                  style={{ maxWidth: "100%", maxHeight: "200px" }} 
                />
              </div>
            )}
            <FileUploader onFileUploaded={handleFileUploaded} />
          </div>
        </Form.Item>
      </Form>
      
      <Modal
        title="Подтверждение удаления"
        open={showDeleteConfirm}
        onOk={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        okText="Удалить"
        cancelText="Отмена"
      >
        <p>Вы уверены, что хотите удалить эту ручку?</p>
      </Modal>
    </div>
  );
};

export default KnobSelection;
