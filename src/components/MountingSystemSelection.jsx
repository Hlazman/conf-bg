import React, { useState, useEffect, useMemo, useContext, forwardRef, useImperativeHandle } from "react";
import { Checkbox, Spin, Empty } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

// Запрос для получения mounting systems
const GET_MOUNTING_SYSTEMS = gql`
  query Products($filters: ProductFiltersInput) {
    products(filters: $filters) {
      documentId
      title
    }
  }`;

// Запрос для получения существующего SuborderProduct
const GET_SUBORDER_PRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      product {
        documentId
        brand
        title
        type
        description
        guarantee
        image {
          url
          documentId
        }
        maxSizes {
          height
          width
        }
        collections {
          documentId
        }
      }
    }
  }`;

// Мутация для создания SuborderProduct
const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) {
      documentId
    }
  }`;

// Мутация для удаления SuborderProduct
const DELETE_SUBORDER_PRODUCT = gql`
  mutation DeleteSuborderProduct($documentId: ID!) {
    deleteSuborderProduct(documentId: $documentId) {
      documentId
    }
  }`;

const MountingSystemSelection = forwardRef(({ 
  suborderId, 
  selectedProduct, 
  onMountingSystemChange 
}, ref) => {
  const [mountingSystemProductId, setMountingSystemProductId] = useState(null);
  const [hasMountingSystem, setHasMountingSystem] = useState(false);
  const [mountingSystemChanged, setMountingSystemChanged] = useState(false);
  
  const { translations } = useContext(LanguageContext);

  // Запрос для получения mounting systems совместимых с выбранным продуктом
  const { data: mountingSystemsData, loading: loadingMountingSystems } = useQuery(GET_MOUNTING_SYSTEMS, {
    variables: {
      filters: {
        compatibleProductss: selectedProduct ? {
          documentId: {
            eq: selectedProduct.documentId
          }
        } : undefined,
        type: {
          eqi: "mountingSystem"
        }
      }
    },
    skip: !selectedProduct
  });

  // Запрос для получения существующего mounting system
  const { data: mountingSystemProductData, loading: loadingMountingSystemProduct, refetch: refetchMountingSystem } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "mountingSystem"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для создания SuborderProduct
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      refetchMountingSystem();
      if (onMountingSystemChange) {
        onMountingSystemChange();
      }
    }
  });

  // Мутация для удаления SuborderProduct
  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      refetchMountingSystem();
      if (onMountingSystemChange) {
        onMountingSystemChange();
      }
    }
  });

  // Получаем mounting systems из результатов запроса
  const mountingSystems = useMemo(() => {
    return mountingSystemsData?.products || [];
  }, [mountingSystemsData]);

  // Проверяем, есть ли совместимые mounting systems
  const hasMountingSystemCompatibility = useMemo(() => {
    return mountingSystems.length > 0;
  }, [mountingSystems]);

  // Эффект для проверки наличия mounting system
  useEffect(() => {
    if (!loadingMountingSystemProduct && mountingSystemProductData) {
      if (mountingSystemProductData.suborderProducts && mountingSystemProductData.suborderProducts.length > 0) {
        const mountingSystemProduct = mountingSystemProductData.suborderProducts[0];
        setMountingSystemProductId(mountingSystemProduct.documentId);
        setHasMountingSystem(true);
      } else {
        setMountingSystemProductId(null);
        setHasMountingSystem(false);
      }
    }
  }, [mountingSystemProductData, loadingMountingSystemProduct]);

  // Эффект для проверки совместимости mounting system при смене продукта
  useEffect(() => {
    if (selectedProduct && mountingSystemProductId && !loadingMountingSystems) {
      if (!hasMountingSystemCompatibility) {
        handleDeleteMountingSystem();
      }
    }
  }, [selectedProduct, hasMountingSystemCompatibility, mountingSystemProductId, loadingMountingSystems]);

  // Функция для обработки изменения состояния mounting system
  const handleMountingSystemChange = (e) => {
    setHasMountingSystem(e.target.checked);
    setMountingSystemChanged(true);
  };

  // Функция для удаления mounting system
  const handleDeleteMountingSystem = async () => {
    if (mountingSystemProductId) {
      try {
        await deleteSuborderProduct({
          variables: {
            documentId: mountingSystemProductId
          }
        });
        setMountingSystemProductId(null);
        setHasMountingSystem(false);
        setMountingSystemChanged(false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Функция для сохранения mounting system
  const saveMountingSystem = async () => {
    if (mountingSystemChanged && hasMountingSystemCompatibility) {
      if (hasMountingSystem) {
        if (!mountingSystemProductId && mountingSystems.length > 0) {
          await createSuborderProduct({
            variables: {
              data: {
                suborder: suborderId,
                type: "mountingSystem",
                product: mountingSystems[0].documentId
              }
            }
          });
        }
      } else {
        if (mountingSystemProductId) {
          await deleteSuborderProduct({
            variables: {
              documentId: mountingSystemProductId
            }
          });
        }
      }
      setMountingSystemChanged(false);
    }
  };

  // Экспортируем функцию сохранения для использования в родительском компоненте
  useImperativeHandle(ref, () => ({
    saveMountingSystem
  }));

  if (!selectedProduct) {
    return <Empty description={translations.noData} />;
  }

  return (
    <div>
      {loadingMountingSystems ? (
        <Spin />
      ) : hasMountingSystemCompatibility ? (
        <div>
          <Checkbox
            checked={hasMountingSystem}
            onChange={handleMountingSystemChange}
          >
            {translations.mountingSystem}
          </Checkbox>
        </div>
      ) : (
        <Empty description={translations.noData} />
      )}
    </div>
  );
});

export default MountingSystemSelection;
