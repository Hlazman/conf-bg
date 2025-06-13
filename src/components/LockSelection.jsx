import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Spin, Empty, Button, message, Alert, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import ArchiveOverlay from './ArchiveOverlay';


const GET_LOCKS = gql`
query GetLocks($filters: ProductFiltersInput, $pagination: PaginationArg) {
  products(filters: $filters, pagination: $pagination) {
    documentId
    archive
    title
    type
    image {
      url
    }
    collections {
      documentId
      title
    }
    type
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
      brand
      title
      description
      guarantee
      image {
        url
        documentId
      }
      collections {
        documentId
        title
      }
      maxSizes {
        height
        width
      }
      type
    }
  }
}`;

const LockSelection = ({ suborderId, selectedLock, onLockSelect, onAfterSubmit }) => {
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
      message.success(translations.dataSaved);
      setSaving(false);
      refetchLock();
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
      refetchLock();
    },
    onError: (error) => {
      message.error(`${translations.editError}: ${error.message}`);
      setSaving(false);
    }
  });

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
      message.error(translations.err);
      return;
    }
    
    if (!selectedLock) {
      message.error(`${translations.choose} ${translations.lock}`);
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
    // Update title in collapse
    if (onAfterSubmit) {
      await onAfterSubmit();
    }
      
      message.success(translations.dataSaved);
      setSaving(false);
      refetchLock();
    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingLockProduct) return <Spin size="large" />;

  if (error) return <Alert message={`${translations.loadError}: ${error.message}`} type="error" />;

  return (
    <div>
      <Divider orientation="left">{translations.selection} {translations.lock}</Divider> 
        <div style={{ display: 'flex', justifyContent: 'right', alignItems: 'center', marginBottom: 32, marginTop: -45 }}>
          <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          disabled={!selectedLock}
          style={!lockProductId? {} : { backgroundColor: '#52C41A' }}
          >
            {lockProductId? translations.update : translations.save}
          </Button>
        </div>
      
      {locks.length === 0 ? (
        <Empty description={translations.noData} />
      ) : (
      <Row gutter={[16, 16]}>
        {locks.map(lock => (
          <Col span={4} key={lock.documentId}>
          {/* <Card
            hoverable
            cover={
              lock.image?.url ? 
              <img 
                alt={lock.title} 
                src={`https://dev.api.boki-groupe.com${lock.image.url}`} 
                style={{ height: 200, objectFit: 'cover' }}
              /> : 
              <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {translations.noImage}
              </div>
            }
            onClick={() => onLockSelect(lock)}
            style={{
            border: selectedLock?.documentId === lock.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
            }}
          >
          <Card.Meta title={lock.title} />
          </Card> */}

          <Card
            hoverable={!lock.archive}
            cover={
              <div style={{ position: 'relative' }}>
                {lock.image?.url ? (
                  <img
                    alt={lock.title}
                    src={`https://dev.api.boki-groupe.com${lock.image.url}`}
                    style={{ height: 200, objectFit: 'cover', width: '100%' }}
                  />
                ) : (
                  <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {translations.noImage}
                  </div>
                )}
                {lock.archive && <ArchiveOverlay text={translations.notAvailable} />}
              </div>
            }
            onClick={() => {
              if (!lock.archive) onLockSelect(lock);
            }}
            style={{
              border: selectedLock?.documentId === lock.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0',
              cursor: lock.archive ? 'not-allowed' : 'pointer',
              position: 'relative'
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
