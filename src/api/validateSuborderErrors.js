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
              sizes {
                height
                width
                length
                thickness
                blockHeight
                blockWidth
                holeHeight
                holeWidth
                type
              }
              product {
                compatibleHiddenFrames {
                  documentId
                }
                compatibleSimpleFrames {
                  documentId
                }
                compatibleHiddenHinges { 
                  documentId
                }
                compatibleSimpleHinges { 
                  documentId
                }
                decorCombinations
                title
                type
                documentId
                maxSizes {
                  height
                  width
                }
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
      variables: { documentId },
    });

    // 2. Создаем объект с продуктами
    const products = {};
    const optionProducts = []; // Отдельный массив для продуктов типа "option"
    let doorProduct = null;

    suborderData.suborder.suborder_products.forEach(product => {
      const productType = product?.product?.type;
      const productId = product?.product?.documentId;
      
      if (["door", "hiddenDoor", "slidingDoor"].includes(productType)) {
        products[productType] = {
          documentId: productId,
          decorType: product.decor_type?.typeName,
          secondSideDecorType: product.secondSideDecorType?.typeName,
          collections: product.product.collections,

          doorProductTitle: product?.product?.title,
          doorProductHeight: product?.sizes?.height
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
      hingeError: null,
      optionError: null,
      platbandBackError: null,
      platbandError: null,
      platbandFrontError: null,
      platbandThreadError: null,
      doorParamsError: null,
      slidingError: null
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


    // 5. Проверяем совместимость опций с дверью
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

    // 6. Проверяем совместимость рамы с дверью
    if (products.frame && doorProduct) {
      const currentType = localStorage.getItem('currentType');
      let compatibilityField;

      if (currentType === "hiddenDoor") {
        compatibilityField = "compatibleHiddenFrames";
      } else if (currentType === "door" || currentType === "slidingDoor") {
        compatibilityField = "compatibleSimpleFrames";
      }
      
      if (compatibilityField) {
        const { data: frameData } = await client.query({
          query: gql`
            query Products($documentId: ID!, $pagination: PaginationArg) {
              product(documentId: $documentId) {
                ${compatibilityField}(pagination: $pagination) {
                  documentId
                }
              }
            }
          `,
          variables: {
            documentId: products.frame.documentId,
            pagination: { limit: 200 }
          }
        });

        const compatibleFrames = frameData.product[compatibilityField] || [];
        
        // Проверяем, есть ли дверь в списке совместимых рам
        const isDoorCompatible = compatibleFrames.some(
          frame => frame.documentId === doorProduct.documentId
        );
        
        errors.frameError = !isDoorCompatible ? true : null;
      } else {
        // Если тип двери не определен, считаем что ошибки нет
        errors.frameError = null;
      }
    }

    // 7.1. Проверяем, несовместим ли extender с рамой
    if (products.frame && products.extender) {
      const { data: frameIncompatibilityData } = await client.query({
        query: gql`
          query FrameWithIncompatibilities($documentId: ID!) {
            product(documentId: $documentId) {
              incompatibleProducts {
                documentId
              }
            }
          }
        `,
        variables: {
          documentId: products.frame.documentId
        }
      });
      const incompatibleIds = frameIncompatibilityData?.product?.incompatibleProducts?.map(p => p.documentId) || [];

      errors.extenderError = incompatibleIds.includes(products.extender.documentId) ? true : null;
    }

    // 7.2. Проверяем, несовместим ли extender с дверями
    const productDoor = products.door || products.hiddenDoor || products.slidingDoor || null;

    if (products.extender) {
      const { data: doorIncompatibilityData } = await client.query({
        query: gql`
          query DoorWithIncompatibilities($documentId: ID!) {
            product(documentId: $documentId) {
              compatibleProductss {
                documentId
              }
            }
          }
        `,
        variables: {
          // documentId: products.frame.documentId
          documentId: products.extender.documentId
        }
      });

      const incompatibleIds = doorIncompatibilityData?.product?.compatibleProductss?.map(p => p.documentId) || [];

      // errors.extenderError = incompatibleIds.includes(productDoor.documentId) ? true : null;
      errors.extenderError = !incompatibleIds.includes(productDoor.documentId) ? true : null;
    }

    // 8. Проверяем совместимость петель с дверью
    // if (products.hinge && doorProduct) {
    //   const currentType = localStorage.getItem('currentType');
    //   let compatibilityField;

    //   if (currentType === "hiddenDoor") {
    //     compatibilityField = "compatibleHiddenHinges";
    //   } else if (currentType === "door" || currentType === "slidingDoor") {
    //     compatibilityField = "compatibleSimpleHinges";
    //   }
      
    //   if (compatibilityField) {
    //     const { data: hingeData } = await client.query({
    //       query: gql`
    //         query Products($documentId: ID!, $pagination: PaginationArg) {
    //           product(documentId: $documentId) {
    //             ${compatibilityField}(pagination: $pagination) {
    //               documentId
    //             }
    //           }
    //         }
    //       `,
    //       variables: {
    //         documentId: products.hinge.documentId,
    //         pagination: { limit: 200 }
    //       }
    //     });

    //     const compatibleHinges = hingeData.product[compatibilityField] || [];
        
    //     // Проверяем, есть ли дверь в списке совместимых рам
    //     const isDoorCompatible = compatibleHinges.some(
    //       hinge => hinge.documentId === doorProduct.documentId
    //     );
        
    //     errors.hingeError = !isDoorCompatible ? true : null;
    //   } else {
    //     // Если тип двери не определен, считаем что ошибки нет
    //     errors.hingeError = null;
    //   }
    // }

    if (products.hinge && doorProduct) {
      const currentType = localStorage.getItem('currentType');
      let compatibilityField;
      if (currentType === "hiddenDoor") {
        compatibilityField = "compatibleHiddenHinges";
      } else if (currentType === "door" || currentType === "slidingDoor") {
        compatibilityField = "compatibleSimpleHinges";
      }

      // Данные о двери
      const doorTitle = doorProduct.doorProductTitle;
      const doorHeight = doorProduct.doorProductHeight;
      const doorDecorType = doorProduct.decorType;

      // Грузим данные о петле
      const { data: hingeData } = await client.query({
        query: gql`
          query GetHinge($id: ID!) {
            product(documentId: $id) {
              documentId
              decorCombinations
              maxSizes { height }
              decor_types { typeName }
            }
          }
        `,
        variables: { id: products.hinge.documentId }
      });

      const hinge = hingeData.product;

      let isCompatible = true;

      // decorCombinations, если есть для данной двери
      let combos = hinge.decorCombinations;
      if (combos && typeof combos === 'string') {
        try { combos = JSON.parse(combos); } catch { combos = {}; }
      }
      if (combos && doorTitle && combos[doorTitle]) {
        const { Decors, maxHeight, minHeight } = combos[doorTitle];

        if (Array.isArray(Decors) && Decors.length > 0 && doorDecorType) {
          if (!Decors.includes(doorDecorType)) {
            isCompatible = false;
          }
        }

        if (maxHeight !== null && maxHeight !== undefined && doorHeight && +doorHeight > +maxHeight) {
          isCompatible = false;
        }
        if (minHeight !== null && minHeight !== undefined && doorHeight && +doorHeight < +minHeight) {
          isCompatible = false;
        }
      }

      // Если нет combos — пусть будет как было: проверяем поле совместимости
      if (isCompatible && compatibilityField) {
        const { data: hingeCompData } = await client.query({
          query: gql`
            query Products($documentId: ID!, $pagination: PaginationArg) {
              product(documentId: $documentId) {
                ${compatibilityField}(pagination: $pagination) {
                  documentId
                }
              }
            }
          `,
          variables: {
            documentId: products.hinge.documentId,
            pagination: { limit: 200 }
          }
        });

        const compatibleHinges = hingeCompData.product[compatibilityField] || [];
        if (!compatibleHinges.some(h => h.documentId === doorProduct.documentId)) {
          isCompatible = false;
        }
      }

      errors.hingeError = !isCompatible ? true : null;
    }

    // 9. Проверяем совместимость декоров
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

      let frontDecorTypeValid = true;
      let backDecorTypeValid = true;

      const frontType = doorProduct.decorType;
      const backType = doorProduct.secondSideDecorType;

      frontDecorTypeValid = !frontType || decorTypeNames.includes(frontType);

      if (frontType && backType) {
        const { data: productData } = await client.query({
          query: gql`
            query GetProduct($id: ID!) {
              product(documentId: $id) {
                decorCombinations
              }
            }
          `,
          variables: {
            id: doorProduct.documentId
          }
        });

        const combinations = productData?.product?.decorCombinations || {};
        const allowedBackTypes = combinations[frontType] || [];

        backDecorTypeValid = allowedBackTypes.includes(backType);
      }

      errors.decorError = (!frontDecorTypeValid || !backDecorTypeValid) ? true : null;
    }

    // 10. Проверяем дверные параматре относительно высоты и ширины
    const doorProducts = suborderData.suborder.suborder_products
    .filter(p => ["door", "hiddenDoor", "slidingDoor"].includes(p?.product?.type));

    const allDoorParamsValid = doorProducts.every(p => {
      if (!p.sizes || !p.product.maxSizes?.length) return true; // Если нет данных, считаем валидным
      
      const savedHeight = p.sizes.height;
      const savedWidth = p.sizes.width;
      
      return p.product.maxSizes.some(size => 
        savedHeight <= size.height && 
        savedWidth <= size.width
      );
    });

    errors.doorParamsError = !allDoorParamsValid ? true : null;

    // 11. Проверяем совместимость slidingFrame с дверью
    if (products.slidingFrame) {
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
          documentId: products.slidingFrame.documentId,
          pagination: { limit: 200 }
        }
      });

      const compatibleProducts = compatibilityData.product.compatibleProductss || [];
      const isDoorCompatible = compatibleProducts.some(p => p.documentId === doorProductId);

      errors.slidingError = !isDoorCompatible ? true : null;
    }

    // 12. Отправляем обновленные ошибки на сервер
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
