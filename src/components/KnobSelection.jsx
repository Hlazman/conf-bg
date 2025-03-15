// import React, { useState, useEffect, useMemo } from "react";
// import { Card, Row, Col, Typography, Spin, Empty, Button, message, Input, InputNumber, Upload, Alert } from "antd";
// import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
// import { useQuery, useMutation, gql } from "@apollo/client";

// const { Title } = Typography;

// const GET_KNOBS = gql`
// query GetKnobs($filters: ProductFiltersInput, $pagination: PaginationArg) {
//   products(filters: $filters, pagination: $pagination) {
//     documentId
//     title
//     type
//     image {
//       url
//     }
//   }
// }`;

// const CREATE_SUBORDER_PRODUCT = gql`
// mutation CreateSuborderProduct($data: SuborderProductInput!) {
//   createSuborderProduct(data: $data) {
//     documentId
//   }
// }`;

// const UPDATE_SUBORDER_PRODUCT = gql`
// mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
//   updateSuborderProduct(documentId: $documentId, data: $data) {
//     documentId
//   }
// }`;

// const DELETE_SUBORDER_PRODUCT = gql`
// mutation DeleteSuborderProduct($documentId: ID!) {
//   deleteSuborderProduct(documentId: $documentId) {
//     documentId
//   }
// }`;

// const GET_SUBORDER_PRODUCT = gql`
// query GetSuborderProduct($filters: SuborderProductFiltersInput) {
//   suborderProducts(filters: $filters) {
//     documentId
//     customTitle
//     customImage{
//       url
//     }
//     productCostNetto
//     product {
//       documentId
//       title
//       image {
//         url
//       }
//       type
//     }
//   }
// }`;

// const KnobSelection = ({ suborderId, collectionId, selectedKnob, onKnobSelect }) => {
//   const [knobProductId, setKnobProductId] = useState(null);
//   const [customTitle, setCustomTitle] = useState("");
//   const [customImage, setCustomImage] = useState(null);
//   const [productCostNetto, setProductCostNetto] = useState(0);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [imagePreview, setImagePreview] = useState(null);

//   const { loading, error, data } = useQuery(GET_KNOBS, {
//     variables: {
//       filters: {
//         type: {
//           eqi: "knob"
//         }
//       },
//       pagination: {
//         limit: 30
//       }
//     }
//   });

//   const { data: knobProductData, loading: loadingKnobProduct, refetch: refetchKnob } = useQuery(GET_SUBORDER_PRODUCT, {
//     variables: {
//       filters: {
//         suborder: {
//           documentId: {
//             eq: suborderId
//           }
//         },
//         type: {
//           eq: "knob"
//         }
//       }
//     },
//     skip: !suborderId,
//     fetchPolicy: "network-only"
//   });

//   const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
//     onCompleted: (data) => {
//       message.success("Ручка успешно добавлена");
//       setSaving(false);
//       refetchKnob();
//     },
//     onError: (error) => {
//       message.error(`Ошибка при сохранении: ${error.message}`);
//       setSaving(false);
//     }
//   });

//   const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
//     onCompleted: () => {
//       message.success("Ручка успешно обновлена");
//       setSaving(false);
//       refetchKnob();
//     },
//     onError: (error) => {
//       message.error(`Ошибка при обновлении: ${error.message}`);
//       setSaving(false);
//     }
//   });

//   const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
//     onCompleted: () => {
//       message.success("Ручка успешно удалена");
//       setDeleting(false);
//       setKnobProductId(null);
//       setCustomTitle("");
//       setCustomImage(null);
//       setImagePreview(null);
//       setProductCostNetto(0);
//       onKnobSelect(null);
//       refetchKnob();
//     },
//     onError: (error) => {
//       message.error(`Ошибка при удалении: ${error.message}`);
//       setDeleting(false);
//     }
//   });

//   const knobs = useMemo(() => {
//     return data?.products || [];
//   }, [data]);

//   useEffect(() => {
//     if (!loadingKnobProduct && knobProductData && knobs.length > 0) {
//       if (knobProductData.suborderProducts && knobProductData.suborderProducts.length > 0) {
//         const knobProduct = knobProductData.suborderProducts[0];
//         setKnobProductId(knobProduct.documentId);
//         setCustomTitle(knobProduct.customTitle || "");
//         setProductCostNetto(knobProduct.productCostNetto || 0);
        
//         if (knobProduct.customImage) {
//           setCustomImage(knobProduct.customImage);
//           setImagePreview(`https://dev.api.boki-groupe.com${knobProduct.customImage}`);
//         }
        
//         if (knobProduct.product && !selectedKnob) {
//           const knobFromProducts = knobs.find(knob =>
//             knob.documentId === knobProduct.product.documentId
//           );
//           if (knobFromProducts) {
//             onKnobSelect(knobFromProducts);
//           }
//         }
//       }
//     }
//   }, [knobs, knobProductData, loadingKnobProduct, onKnobSelect, selectedKnob]);

//   const handleSave = async () => {
//     if (!suborderId) {
//       message.error("ID подзаказа не найден");
//       return;
//     }
    
//     if (!selectedKnob && !customTitle) {
//       message.error("Выберите ручку или укажите название");
//       return;
//     }
    
//     setSaving(true);
    
//     try {
//       const knobData = {
//         suborder: suborderId,
//         type: "knob",
//         customTitle,
//         customImage,
//         productCostNetto
//       };
      
//       if (selectedKnob) {
//         knobData.product = selectedKnob.documentId;
//       }
      
//       if (knobProductId) {
//         await updateSuborderProduct({
//           variables: {
//             documentId: knobProductId,
//             data: knobData
//           }
//         });
//       } else {
//         await createSuborderProduct({
//           variables: {
//             data: knobData
//           }
//         });
//       }
      
//       message.success("Данные успешно сохранены");
//       setSaving(false);
//       refetchKnob();
//     } catch (error) {
//       message.error(`Произошла ошибка: ${error.message}`);
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!knobProductId) {
//       message.error("Нет сохраненной ручки для удаления");
//       return;
//     }
    
//     setDeleting(true);
    
//     try {
//       await deleteSuborderProduct({
//         variables: {
//           documentId: knobProductId
//         }
//       });
//     } catch (error) {
//       message.error(`Произошла ошибка при удалении: ${error.message}`);
//       setDeleting(false);
//     }
//   };

//   const handleImageUpload = ({ file }) => {
//     if (file.status === 'done') {
//       const imageUrl = file.response?.url;
//       if (imageUrl) {
//         setCustomImage(imageUrl);
//         setImagePreview(`https://dev.api.boki-groupe.com${imageUrl}`);
//         message.success(`${file.name} успешно загружен`);
//       }
//     } else if (file.status === 'error') {
//       message.error(`Ошибка загрузки ${file.name}`);
//     }
//   };

//   if (loading || loadingKnobProduct) return <Spin size="large" />;

//   if (error) return <Alert message={`Ошибка загрузки данных: ${error.message}`} type="error" />;

//   return (
//     <div>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//         <Title level={3}>Выбор ручки</Title>
//         <div>
//           <Button
//             type="primary"
//             onClick={handleSave}
//             loading={saving}
//             style={{ marginRight: 8 }}
//           >
//             Сохранить
//           </Button>
//           <Button
//             type="danger"
//             icon={<DeleteOutlined />}
//             onClick={handleDelete}
//             loading={deleting}
//             disabled={!knobProductId}
//           >
//             Удалить
//           </Button>
//         </div>
//       </div>
      
//       <div style={{ marginBottom: 16 }}>
//         <Row gutter={16}>
//           <Col span={8}>
//             <Input 
//               placeholder="Название ручки" 
//               value={customTitle}
//               onChange={(e) => setCustomTitle(e.target.value)}
//               style={{ marginBottom: 8 }}
//             />
            
//             <InputNumber 
//               placeholder="Цена" 
//               value={productCostNetto}
//               onChange={(value) => setProductCostNetto(value || 0)}
//               style={{ width: '100%', marginBottom: 8 }}
//               addonAfter={'Netto'}
//             />
            
//             <Upload
//               name="image"
//               action="/api/upload" // Замените на ваш эндпоинт для загрузки
//               onChange={handleImageUpload}
//               maxCount={1}
//               showUploadList={false}
//             >
//               <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
//                 Загрузить изображение
//               </Button>
//             </Upload>
//           </Col>
          
//           <Col span={16}>
//             {imagePreview && (
//               <div style={{ marginBottom: 16, textAlign: 'center' }}>
//                 <img 
//                   src={imagePreview} 
//                   alt="Предпросмотр" 
//                   style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain' }}
//                 />
//               </div>
//             )}
//           </Col>
//         </Row>
//       </div>
      
//       {knobs.length === 0 ? (
//         <Empty description="Нет доступных ручек" />
//       ) : (
//         <Row gutter={[16, 16]}>
//           {knobs.map(knob => (
//             <Col span={4} key={knob.documentId}>
//               <Card
//                 hoverable
//                 cover={
//                   knob.image?.url ? 
//                   <img 
//                     alt={knob.title} 
//                     src={`https://dev.api.boki-groupe.com${knob.image.url}`} 
//                     style={{ height: 200, objectFit: 'cover' }}
//                   /> : 
//                   <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                     Нет изображения
//                   </div>
//                 }
//                 onClick={() => onKnobSelect(knob)}
//                 style={{
//                   border: selectedKnob?.documentId === knob.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
//                 }}
//               >
//                 <Card.Meta title={knob.title} />
//               </Card>
//             </Col>
//           ))}
//         </Row>
//       )}
//     </div>
//   );
// };

// export default KnobSelection;

// KnobSelection.jsx
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Spin, Form, Input, InputNumber, Button, message, Alert } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import FileUploader from "./FileUploader";

const { Title } = Typography;

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
      type
      customTitle
      customImage {
        url
      }
      productCostNetto
    }
  }
`;

const KnobSelection = ({ suborderId, onKnobSelect }) => {
  const [knobProductId, setKnobProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customImage, setCustomImage] = useState(null);
  const [productCostNetto, setProductCostNetto] = useState(0);
  const [form] = Form.useForm();

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

  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Ручка успешно добавлена");
      setSaving(false);
      refetchKnob();
    },
    onError: (error) => {
      message.error(`Ошибка при сохранении: ${error.message}`);
      setSaving(false);
    }
  });

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

  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Ручка успешно удалена");
      setDeleting(false);
      setKnobProductId(null);
      setCustomTitle("");
      setCustomImage(null);
      setProductCostNetto(0);
      form.resetFields();
      refetchKnob();
    },
    onError: (error) => {
      message.error(`Ошибка при удалении: ${error.message}`);
      setDeleting(false);
    }
  });

  useEffect(() => {
    if (!loadingKnobProduct && knobProductData) {
      if (knobProductData.suborderProducts && knobProductData.suborderProducts.length > 0) {
        const knobProduct = knobProductData.suborderProducts[0];
        setKnobProductId(knobProduct.documentId);
        setCustomTitle(knobProduct.customTitle || "");
        setCustomImage(knobProduct.customImage?.url || null);
        setProductCostNetto(knobProduct.productCostNetto || 0);
        
        form.setFieldsValue({
          customTitle: knobProduct.customTitle || "",
          productCostNetto: knobProduct.productCostNetto || 0
        });
      }
    }
  }, [knobProductData, loadingKnobProduct, form]);

  const handleFileUploaded = (file) => {
    setCustomImage(file.url);
  };

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
      const knobData = {
        suborder: suborderId,
        type: "knob",
        customTitle: customTitle,
        customImage: customImage,
        productCostNetto: productCostNetto
      };

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

      message.success("Данные успешно сохранены");
      setSaving(false);
      refetchKnob();
    } catch (error) {
      message.error(`Произошла ошибка: ${error.message}`);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!knobProductId) {
      message.error("Ручка не найдена");
      return;
    }

    setDeleting(true);
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

  if (loadingKnobProduct) return <Spin size="large" tip="Загрузка..." />;

  return (
    <div>
      <Title level={4}>Создать ручку</Title>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          customTitle: customTitle,
          productCostNetto: productCostNetto
        }}
      >
        <Form.Item
          name="customTitle"
          label="Название ручки"
          rules={[{ required: true, message: "Введите название ручки" }]}
        >
          <Input
            placeholder="Введите название ручки"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="productCostNetto"
          label="Цена"
          rules={[{ required: true, message: "Введите цену" }]}
        >
          <InputNumber
            placeholder="Введите цену"
            value={productCostNetto}
            onChange={(value) => setProductCostNetto(value)}
            min={0}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item label="Изображение ручки">
          <FileUploader onFileUploaded={handleFileUploaded} />
          {customImage && (
            <Card
                hoverable
                cover={
                <img
                    alt="Изображение ручки"
                    src={customImage}
                    style={{ height: 200, objectFit: 'cover' }}
                />
                }
            >
                <Card.Meta title={customTitle} description={`Цена: ${productCostNetto}`} />
            </Card>
            )}
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              block
            >
              Сохранить
            </Button>
          </Col>
          {knobProductId && (
            <Col span={12}>
              <Button
                type="primary"
                danger
                onClick={handleDelete}
                loading={deleting}
                block
              >
                Удалить
              </Button>
            </Col>
          )}
        </Row>
      </Form>

      {knobProductData?.suborderProducts && knobProductData.suborderProducts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Текущая ручка</Title>
          <Card>
            <Card.Meta
              title={knobProductData.suborderProducts[0].customTitle}
              description={`Цена: ${knobProductData.suborderProducts[0].productCostNetto}`}
            />
            {knobProductData.suborderProducts[0].customImage?.url && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={knobProductData.suborderProducts[0].customImage.url}
                  alt="Изображение ручки"
                  style={{ maxWidth: "100%", maxHeight: 200 }}
                />
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default KnobSelection;
