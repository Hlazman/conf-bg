import { gql } from "@apollo/client";

export const validateSuborderProducts = async (client, documentId) => {
  try {
    // 1. Получаем данные о субордере
    const { data: suborderData } = await client.query({
      query: gql`
        query Suborder($documentId: ID!) {
          suborder(documentId: $documentId) {
            documentId
            suborder_products {
              documentId
              product {
                title
                type
                documentId
                collections {
                  documentId
                  title
                }
                brand   
                description
                guarantee
                image {
                  documentId
                }
              }
              decor_type {
                documentId
                typeName
              }
              secondSideDecorType {
                typeName
                documentId
              }
            }
          }
        }
      `,
      variables: { documentId }
    });

    // 2. Создаем объект с продуктами
    const products = {};
    const optionProducts = []; // Отдельный массив для продуктов типа "option"
    let doorProduct = null;

    suborderData.suborder.suborder_products.forEach(product => {
      const productType = product.product.type;
      const productId = product.product.documentId;
      
      if (["door", "hiddenDoor", "slidingDoor"].includes(productType)) {
        products[productType] = {
          documentId: productId,
          decorType: product.decor_type?.typeName,
          secondSideDecorType: product.secondSideDecorType?.typeName,
          collections: product.product.collections
        };
        doorProduct = products[productType];
      } else if (productType === "option") {
        // Сохраняем все продукты типа "option" в отдельный массив
        optionProducts.push({
          documentId: productId,
          title: product.product.title
        });
      } else {
        products[productType] = {
          documentId: productId
        };
      }
    });

    // Проверяем наличие двери
    if (!doorProduct) {
      throw new Error("No door product found in suborder");
    }

    // 3. Инициализируем объект ошибок
    const errors = {
      aluminumCladdingError: null,
      aluminumFrameError: null,
      aluminumMoldingError: null,
      decorError: null,
      extenderError: null,
      frameError: null,
      optionError: null,
      platbandBackError: null,
      platbandError: null,
      platbandFrontError: null,
      platbandThreadError: null
    };

    // 4. Проверяем совместимость продуктов
    const productTypesToCheck = [
      "aluminumCladding", "aluminumFrame", "aluminumMolding", 
      "extender", "platbandBack", "platband", 
      "platbandFront", "platbandThread"
    ];

    // Сохраняем ID двери перед циклом для избежания предупреждения ESLint
    const doorProductId = doorProduct.documentId;

    // Проверяем совместимость обычных продуктов
    for (const type of productTypesToCheck) {
      if (products[type]) {
        const { data: compatibilityData } = await client.query({
          query: gql`
            query Products($documentId: ID!, $pagination: PaginationArg) {
              product(documentId: $documentId) {
                compatibleProductss(pagination: $pagination) {
                  documentId
                  title
                }
              }
            }
          `,
          variables: {
            documentId: products[type].documentId,
            pagination: { limit: 200 }
          }
        });

        // Проверяем, есть ли дверь в списке совместимых продуктов
        const compatibleProducts = compatibilityData.product.compatibleProductss || [];
        const isDoorCompatible = compatibleProducts.some(p => p.documentId === doorProductId);
        
        // Устанавливаем ошибку, если дверь несовместима
        const errorField = `${type}Error`;
        errors[errorField] = !isDoorCompatible ? true : null;
      }
    }

    // Проверяем совместимость опций с дверью
    let hasIncompatibleOption = false;
    
    for (const option of optionProducts) {
      const { data: compatibilityData } = await client.query({
        query: gql`
          query Products($documentId: ID!, $pagination: PaginationArg) {
            product(documentId: $documentId) {
              compatibleProductss(pagination: $pagination) {
                documentId
                title
              }
            }
          }
        `,
        variables: {
          documentId: option.documentId,
          pagination: { limit: 200 }
        }
      });

      // Проверяем, есть ли дверь в списке совместимых продуктов
      const compatibleProducts = compatibilityData.product.compatibleProductss || [];
      const isDoorCompatible = compatibleProducts.some(p => p.documentId === doorProductId);
      
      // Если хотя бы одна опция несовместима, устанавливаем флаг
      if (!isDoorCompatible) {
        hasIncompatibleOption = true;
      }
    }
    
    // Устанавливаем ошибку optionError, если хотя бы одна опция несовместима
    errors.optionError = hasIncompatibleOption ? true : null;

    // 5. Проверяем совместимость рамы с коллекцией двери
    if (products.frame && doorProduct.collections && doorProduct.collections.length > 0) {
      const { data: frameData } = await client.query({
        query: gql`
          query Products($documentId: ID!) {
            product(documentId: $documentId) {
              collections {
                documentId
                title
              }
            }
          }
        `,
        variables: {
          documentId: products.frame.documentId
        }
      });

      const frameCollections = frameData.product.collections || [];
      const frameCollectionIds = frameCollections.map(c => c.documentId);
      
      // Проверяем, есть ли хотя бы одна общая коллекция
      const hasMatchingCollection = doorProduct.collections.some(
        doorCollection => frameCollectionIds.includes(doorCollection.documentId)
      );
      
      errors.frameError = !hasMatchingCollection ? true : null;
    }

    // 6. Проверяем совместимость декоров
    if (doorProduct) {
      const { data: decorTypesData } = await client.query({
        query: gql`
          query Query($filters: DecorTypeFiltersInput) {
            decorTypes(filters: $filters) {
              typeName
              documentId
            }
          }
        `,
        variables: {
          filters: {
            products: {
              documentId: {
                eqi: doorProduct.documentId
              }
            }
          }
        }
      });

      const availableDecorTypes = decorTypesData.decorTypes || [];
      const decorTypeNames = availableDecorTypes.map(dt => dt.typeName);
      
      // Проверяем, соответствуют ли типы декора доступным для данной двери
      const frontDecorTypeValid = !doorProduct.decorType || decorTypeNames.includes(doorProduct.decorType);
      const backDecorTypeValid = !doorProduct.secondSideDecorType || decorTypeNames.includes(doorProduct.secondSideDecorType);
      
      errors.decorError = (!frontDecorTypeValid || !backDecorTypeValid) ? true : null;
    }

    // 7. Отправляем обновленные ошибки на сервер
    await client.mutate({
      mutation: gql`
        mutation Mutation($documentId: ID!, $data: SuborderInput!) {
          updateSuborder(documentId: $documentId, data: $data) {
            documentId
          }
        }
      `,
      variables: {
        documentId,
        data: {
          suborderErrors: errors
        }
      }
    });

    return { success: true, errors };
  } catch (error) {
    console.error("Error validating suborder products:", error);
    return { success: false, error: error.message };
  }
};
