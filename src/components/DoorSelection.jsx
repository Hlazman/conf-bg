import React, { useState, useEffect, useMemo, useContext } from "react";
import { Tabs, Card, Row, Col, Typography, Spin, Empty, Button, message } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { GET_PRODUCTS } from '../api/queries';
import { useApolloClient } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

const { Title } = Typography;

// Мутация для создания SuborderProduct
const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) {
      documentId
    }
  }
`;

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
      product {
        documentId
        title
      }
      type
    }
  }
`;

// const DoorSelection = ({ selectedDoor, onDoorSelect, suborderId }) => {
const DoorSelection = ({ selectedDoor, onDoorSelect, suborderId, checkErrors }) => {
  const [suborderProductId, setSuborderProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { translations } = useContext(LanguageContext);

  const doorType = localStorage.getItem('currentType');
  const [activeTabKey, setActiveTabKey] = useState(null); // ДЛЯ ВКЛАДОК

  const client = useApolloClient();

  // Запрос на получение дверей
  const { loading, error, data } = useQuery(GET_PRODUCTS, {
    variables: {
      pagination: {
        limit: 100
      },
      filters: {
        type: {
          // eqi: "door"
          in: doorType === "hiddenDoor" ? ["door", "hiddenDoor"] : ["door"]
        }
      }
    }
  });

  // const doors = data?.products?.filter(product =>
  //   (doorType === "hiddenDoor" ? 
  //     (product.type === "door" || product.type === "hiddenDoor") : 
  //     product.type === "door") &&
  //   product.collections &&
  //   product.collections.length > 0
  // ) || [];

  // Обработка данных после загрузки с использованием useMemo
  const doors = useMemo(() => {
    return data?.products?.filter(product =>
      (doorType === "hiddenDoor" ? 
        (product.type === "door" || product.type === "hiddenDoor") : 
        product.type === "door") &&
      product.collections &&
      product.collections.length > 0
    ) || [];
  }, [data, doorType]);

  const { data: suborderProductData, loading: loadingSuborderProduct, refetch } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          // eq: "door"
          eq: doorType // Используем тип из localStorage
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для создания SuborderProduct
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      setSuborderProductId(data.createSuborderProduct.documentId);
      message.success("Дверь успешно сохранена");
      setSaving(false);
      refetch(); // Обновляем данные после успешного создания
    },
    onError: (error) => {
      message.error(`Ошибка при сохранении: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Дверь успешно обновлена");
      setSaving(false);
      refetch(); // Обновляем данные после успешного обновления
    },
    onError: (error) => {
      message.error(`Ошибка при обновлении: ${error.message}`);
      setSaving(false);
    }
  });

  // Получаем уникальные коллекции из дверей
  const collections = doors.reduce((acc, door) => {
    door.collections.forEach(collection => {
      if (!acc.some(c => c.documentId === collection.documentId)) {
        acc.push(collection);
      }
    });
    return acc;
  }, []);

  // Сортируем коллекции по алфавиту
  collections.sort((a, b) => a.title.localeCompare(b.title));

  // Группируем двери по коллекциям и сортируем внутри каждой коллекции по title
  const doorsByCollection = collections.reduce((acc, collection) => {
    acc[collection.documentId] = doors
      .filter(door => door.collections.some(c => c.documentId === collection.documentId))
      .sort((a, b) => a.title.localeCompare(b.title));
    return acc;
  }, {});

  // Эффект для загрузки данных при изменении doors
  useEffect(() => {
    if (!loadingSuborderProduct && suborderProductData && doors.length > 0) {
      if (suborderProductData.suborderProducts && suborderProductData.suborderProducts.length > 0) {
        const suborderProduct = suborderProductData.suborderProducts[0];
        setSuborderProductId(suborderProduct.documentId);
        
        // Если есть продукт и пользователь еще не выбрал дверь, устанавливаем её
        if (suborderProduct.product && !selectedDoor) {
          const doorFromProducts = doors.find(door => 
            door.documentId === suborderProduct.product.documentId
          );
          if (doorFromProducts) {
            onDoorSelect(doorFromProducts);

          // Для ВКЛАДОК
          // Находим коллекцию выбранной двери и устанавливаем её как активную вкладку
          const doorCollection = doorFromProducts.collections[0];
            if (doorCollection) {
              setActiveTabKey(doorCollection.documentId);
            }
            // Для ВКЛАДОК
          }
        }
      }
    }
  }, [doors, suborderProductData, loadingSuborderProduct, onDoorSelect, selectedDoor]);

  // Функция сохранения выбранной двери
  // const handleSaveDoor = () => {
  //   if (!selectedDoor) {
  //     message.warning("Пожалуйста, выберите дверь");
  //     return;
  //   }

  //   if (!suborderId) {
  //     message.error("ID подзаказа не найден");
  //     return;
  //   }

  //   setSaving(true);

  //   const doorData = {
  //     suborder: suborderId,
  //     product: selectedDoor.documentId,
  //     // type: "door"
  //     type: doorType // Используем тип из localStorage
  //   };

  //   if (suborderProductId) {
  //     // Обновляем существующий SuborderProduct
  //     updateSuborderProduct({
  //       variables: {
  //         documentId: suborderProductId,
  //         data: doorData
  //       }
  //     });
  //   } else {
  //     // Создаем новый SuborderProduct
  //     createSuborderProduct({
  //       variables: {
  //         data: doorData
  //       }
  //     });
  //   }
  // };

  const handleSaveDoor = async () => {
    if (!selectedDoor) {
      message.warning("Пожалуйста, выберите дверь");
      return;
    }

    if (!suborderId) {
      message.error("ID подзаказа не найден");
      return;
    }

    setSaving(true);

    const doorData = {
      suborder: suborderId,
      product: selectedDoor.documentId,
      // type: "door"
      type: doorType // Используем тип из localStorage
    };

    if (suborderProductId) {
      // Обновляем существующий SuborderProduct
      await updateSuborderProduct({
        variables: {
          documentId: suborderProductId,
          data: doorData
        }
      });
    } else {
      // Создаем новый SuborderProduct
      await createSuborderProduct({
        variables: {
          data: doorData
        }
      });
    }

    if (checkErrors) {
      await checkErrors(client, suborderId);
    }
  };

  if (loading || loadingSuborderProduct) return <Spin size="large" />;

  if (error) return <Empty description={`Ошибка загрузки: ${error.message}`} />;

  if (collections.length === 0) {
    return <Empty description="Нет доступных коллекций дверей" />;
  }

  const doorTabItems = collections.map(collection => ({
    label: collection.title,
    key: collection.documentId,
    children: (
      <Row gutter={[16, 16]}>
        {doorsByCollection[collection.documentId].map(door => (
          <Col span={4} key={door.documentId}>
            <Card
              hoverable
              cover={
                door.image?.url ? 
                <img 
                  alt={door.title} 
                  src={`https://dev.api.boki-groupe.com${door.image.url}`} 
                  style={{ height: 200, objectFit: 'cover' }}
                /> : 
                <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Нет изображения
                </div>
              }
              onClick={() => {
                onDoorSelect(door);
                // console.log("Выбрана дверь:", door.title);
              }}
              style={{
                border: selectedDoor?.documentId === door.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
              }}
            >
              <Card.Meta title={door.title} />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }));

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Выбор двери</Title>
        <Button 
          type="primary" 
          onClick={handleSaveDoor} 
          disabled={!selectedDoor || saving}
          loading={saving}
          style={!suborderProductId ? {} : { backgroundColor: '#52C41A' }}
        >
          {suborderProductId ? translations.update : translations.save}
        </Button>
      </div>
      {/* ДЛЯ ВКЛАДОК */}
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} type="card" items={doorTabItems} />
      {/* <Tabs type="card" items={doorTabItems} /> */}
    </div>
  );
};

export default DoorSelection;


