import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Empty, Button, message, Alert } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

const { Title } = Typography;

const GET_LOCKS = gql`
query GetLocks($filters: ProductFiltersInput, $pagination: PaginationArg) {
  products(filters: $filters, pagination: $pagination) {
    documentId
    title
    type
    image {
      url
    }
  }
}`;

const CREATE_SUBORDER_PRODUCT = gql`
mutation CreateSuborderProduct($data: SuborderProductInput!) {
  createSuborderProduct(data: $data) {
    documentId
  }
}`;

const UPDATE_SUBORDER_PRODUCT = gql`
mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
  updateSuborderProduct(documentId: $documentId, data: $data) {
    documentId
  }
}`;

const GET_SUBORDER_PRODUCT = gql`
query GetSuborderProduct($filters: SuborderProductFiltersInput) {
  suborderProducts(filters: $filters) {
    documentId
    product {
      documentId
      title
      image {
        url
      }
      type
    }
  }
}`;

const LockSelection = ({ suborderId, selectedLock, onLockSelect }) => {
  const [lockProductId, setLockProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { translations } = useContext(LanguageContext);

  const { loading, error, data } = useQuery(GET_LOCKS, {
    variables: {
      filters: {
        type: {
          eqi: "lock"
        }
      },
      pagination: {
        limit: 30
      }
    }
  });

  const { data: lockProductData, loading: loadingLockProduct, refetch: refetchLock } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "lock"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      message.success("Замок успешно добавлен");
      setSaving(false);
      refetchLock();
    },
    onError: (error) => {
      message.error(`Ошибка при сохранении: ${error.message}`);
      setSaving(false);
    }
  });

  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Замок успешно обновлен");
      setSaving(false);
      refetchLock();
    },
    onError: (error) => {
      message.error(`Ошибка при обновлении: ${error.message}`);
      setSaving(false);
    }
  });

//   const locks = data?.products || [];
  const locks = useMemo(() => {
    return data?.products || [];
  }, [data]);

  useEffect(() => {
    if (!loadingLockProduct && lockProductData && locks.length > 0) {
      if (lockProductData.suborderProducts && lockProductData.suborderProducts.length > 0) {
        const lockProduct = lockProductData.suborderProducts[0];
        setLockProductId(lockProduct.documentId);
        if (lockProduct.product && !selectedLock) {
          const lockFromProducts = locks.find(lock =>
            lock.documentId === lockProduct.product.documentId
          );
          if (lockFromProducts) {
            onLockSelect(lockFromProducts);
          }
        }
      }
    }
  }, [locks, lockProductData, loadingLockProduct, onLockSelect, selectedLock]);

  const handleSave = async () => {
    if (!suborderId) {
      message.error("ID подзаказа не найден");
      return;
    }
    
    if (!selectedLock) {
      message.error("Выберите замок");
      return;
    }
    
    setSaving(true);
    
    try {
      const lockData = {
        suborder: suborderId,
        product: selectedLock.documentId,
        type: "lock"
      };
      
      if (lockProductId) {
        await updateSuborderProduct({
          variables: {
            documentId: lockProductId,
            data: lockData
          }
        });
      } else {
        await createSuborderProduct({
          variables: {
            data: lockData
          }
        });
      }
      
      message.success("Данные успешно сохранены");
      setSaving(false);
      refetchLock();
    } catch (error) {
      message.error(`Произошла ошибка: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingLockProduct) return <Spin size="large" />;

  if (error) return <Alert message={`Ошибка загрузки данных: ${error.message}`} type="error" />;

  return (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={3}>Выбор замка</Title>
            <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!selectedLock}
            style={!lockProductId? {} : { backgroundColor: '#52C41A' }}
            >
            {/* Сохранить */}
            {lockProductId? translations.update : translations.save}
            </Button>
        </div>
      
      {locks.length === 0 ? (
        <Empty description="Нет доступных замков" />
      ) : (
      <Row gutter={[16, 16]}>
        {locks.map(lock => (
            <Col span={4} key={lock.documentId}>
            <Card
                hoverable
                cover={
                lock.image?.url ? 
                <img 
                    alt={lock.title} 
                    src={`https://dev.api.boki-groupe.com${lock.image.url}`} 
                    style={{ height: 200, objectFit: 'cover' }}
                /> : 
                <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Нет изображения
                </div>
                }
                onClick={() => onLockSelect(lock)}
                style={{
                border: selectedLock?.documentId === lock.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
                }}
            >
                <Card.Meta title={lock.title} />
            </Card>
            </Col>
        ))}
      </Row>
      )}
    </div>
  );
};

export default LockSelection;
