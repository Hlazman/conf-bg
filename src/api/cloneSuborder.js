import { gql } from "@apollo/client";

// Запрос для получения полных данных о подзаказе
export const GET_SUBORDER_DETAILS = gql`
  query Suborder($documentId: ID!) {
    suborder(documentId: $documentId) {
      documentId
      comment
      double_door
      hidden
      hingesCalculatedCount
      opening
      order {
        documentId
      }
      side
      suborderCost
      suborderErrors {
        decorError
        frameError
        extenderError
        platbandError
        platbandThreadError
        platbandFrontError
        platbandBackError
        aluminumMoldingError
        aluminumFrameError
        aluminumCladdingError
        optionError
        doorParamsError
        hingeError
        slidingError
      }
      suborder_type {
        documentId
        typeName
      }
      suborder_products {
        amount
        colorCode
        customImage {
          documentId
          url
        }
        customTitle
        decor {
          category
          documentId
          image {
            url
            documentId
          }
          title
        }
        decor_type {
          documentId
          typeName
        }
        doorSeal
        doorFilling
        knobInsertion
        lockInsertion
        product {
          title
          documentId
        }
        productCostBasic
        productCostNetto
        secondSideColorCode
        secondSideDecor {
          title
          category
          documentId
          image {
            documentId
            url
          }
        }
        secondSideDecorType {
          documentId
          typeName
        }
        secondSideVeneerDirection
        sizes {
          height
          length
          thickness
          type
          width
          id
          units
          holeWidth
          holeHeight
          deltaWidth
          deltaHeight
          blockWidth
          blockHeight
          doubleDoorWidth
          minWidth
          recomendedWidth
        }
        spindleInsertion
        thresholdInsertion
        type
        veneerDirection
        documentId
        frameTreshold 
        framePainting
        customProductCostNetto
        comment
        knobOpen
      }
    }
  }
`;

// Мутация для создания нового подзаказа
export const CREATE_SUBORDER = gql`
  mutation CreateSuborder($data: SuborderInput!) {
    createSuborder(data: $data) {
      documentId
    }
  }
`;

// Мутация для создания продукта подзаказа
export const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) {
      documentId
    }
  }
`;

export const cloneSuborderWithProducts = async (suborderId, client, messageApi, translations) => {
  try {
    // console.log('Starting clone process for suborderId:', suborderId);
    // console.log('Fetching suborder data...');
    let result;
    try {
      result = await client.query({
        query: GET_SUBORDER_DETAILS,
        variables: { documentId: suborderId },
        fetchPolicy: 'network-only'
      });
    //   console.log('Query completed successfully');
    } catch (queryError) {
    //   console.error('Error in query execution:', queryError);
      messageApi.error(translations.errorFetchingSuborder);
      return null;
    }
    
    // console.log('Query result received');
    
    if (!result.data || !result.data.suborder) {
    //   console.log('No suborder data found in the result');
      messageApi.error(translations.suborderNotFound);
      return null;
    }

    const sourceSuborder = result.data.suborder;
    // console.log('Source suborder data retrieved');
    // console.log('Creating new suborder...');
    let newSuborderData;
    try {
      const createResult = await client.mutate({
        mutation: CREATE_SUBORDER,
        variables: {
          data: {
            hidden: sourceSuborder.hidden,
            order: sourceSuborder.order.documentId,
            suborder_type: sourceSuborder.suborder_type.documentId,
            // comment: sourceSuborder.comment ? `${sourceSuborder.comment} (${translations.copy || 'Copy'})` : translations.copy || 'Copy',
            // double_door: sourceSuborder.double_door || false,
            // hingesCalculatedCount: sourceSuborder.hingesCalculatedCount || 0,
            // opening: sourceSuborder.opening || "outside",
            // side: sourceSuborder.side || "right"
            comment: sourceSuborder.comment,
            double_door: sourceSuborder.double_door,
            hingesCalculatedCount: sourceSuborder.hingesCalculatedCount,
            opening: sourceSuborder.opening,
            side: sourceSuborder.side
          }
        }
      });
      newSuborderData = createResult.data;
    //   console.log('New suborder created successfully');
    } catch (createError) {
    //   console.error('Error creating new suborder:', createError);
      messageApi.error(translations.errCreateSubOrder);
      return null;
    }

    const newSuborderId = newSuborderData.createSuborder.documentId;
    // console.log('New suborder ID:', newSuborderId);

    if (sourceSuborder.suborder_products && sourceSuborder.suborder_products.length > 0) {
    //   console.log(`Cloning ${sourceSuborder.suborder_products.length} suborder products...`);
      
      for (const product of sourceSuborder.suborder_products) {
        // console.log(`Processing product of type: ${product.type}`);
        const productInput = {
          suborder: newSuborderId,
          type: product.type || "door"
        };

        // Добавляем только существующие поля с проверкой на undefined
        if (product.amount !== undefined) productInput.amount = product.amount;
        if (product.customTitle !== undefined) productInput.customTitle = product.customTitle;
        if (product.veneerDirection !== undefined) productInput.veneerDirection = product.veneerDirection;
        if (product.productCostBasic !== undefined) productInput.productCostBasic = product.productCostBasic;
        if (product.productCostNetto !== undefined) productInput.productCostNetto = product.productCostNetto;
        if (product.colorCode !== undefined) productInput.colorCode = product.colorCode;
        if (product.secondSideColorCode !== undefined) productInput.secondSideColorCode = product.secondSideColorCode;
        if (product.secondSideVeneerDirection !== undefined) productInput.secondSideVeneerDirection = product.secondSideVeneerDirection;
        if (product.doorSeal !== undefined) productInput.doorSeal = product.doorSeal;
        if (product.doorFilling !== undefined) productInput.doorFilling = product.doorFilling;
        if (product.knobInsertion !== undefined) productInput.knobInsertion = product.knobInsertion;
        if (product.lockInsertion !== undefined) productInput.lockInsertion = product.lockInsertion;
        if (product.spindleInsertion !== undefined) productInput.spindleInsertion = product.spindleInsertion;
        if (product.thresholdInsertion !== undefined) productInput.thresholdInsertion = product.thresholdInsertion;

        // Добавляем ID связанных объектов
        if (product.product && product.product.documentId) productInput.product = product.product.documentId;
        if (product.decor && product.decor.documentId) productInput.decor = product.decor.documentId;
        if (product.decor_type && product.decor_type.documentId) productInput.decor_type = product.decor_type.documentId;
        if (product.secondSideDecor && product.secondSideDecor.documentId) productInput.secondSideDecor = product.secondSideDecor.documentId;
        if (product.secondSideDecorType && product.secondSideDecorType.documentId) productInput.secondSideDecorType = product.secondSideDecorType.documentId;
        if (product.customImage && product.customImage.documentId) productInput.customImage = product.customImage.documentId;

        // Обрабатываем размеры отдельно
        if (product.sizes) {
          productInput.sizes = {};
          if (product.sizes.height !== undefined) productInput.sizes.height = product.sizes.height;
          if (product.sizes.width !== undefined) productInput.sizes.width = product.sizes.width;
          if (product.sizes.thickness !== undefined) productInput.sizes.thickness = product.sizes.thickness;
          if (product.sizes.length !== undefined) productInput.sizes.length = product.sizes.length;
          if (product.sizes.type !== undefined) productInput.sizes.type = product.sizes.type;
          if (product.sizes.id !== undefined) productInput.sizes.id = product.sizes.id;
          if (product.sizes.units !== undefined) productInput.sizes.units = product.sizes.units;

          if (product.sizes.holeWidth !== undefined) productInput.sizes.holeWidth = product.sizes.holeWidth;
          if (product.sizes.holeHeight !== undefined) productInput.sizes.holeHeight = product.sizes.holeHeight;
          if (product.sizes.deltaWidth !== undefined) productInput.sizes.deltaWidth = product.sizes.deltaWidth;
          if (product.sizes.deltaHeight !== undefined) productInput.sizes.deltaHeight = product.sizes.deltaHeight;
          if (product.sizes.blockWidth !== undefined) productInput.sizes.blockWidth = product.sizes.blockWidth;
          if (product.sizes.blockHeight !== undefined) productInput.sizes.blockHeight = product.sizes.blockHeight;
          if (product.sizes.doubleDoorWidth !== undefined) productInput.sizes.doubleDoorWidth = product.sizes.doubleDoorWidth;
          if (product.sizes.minWidth !== undefined) productInput.sizes.minWidth = product.sizes.minWidth;
          if (product.sizes.recomendedWidth !== undefined) productInput.sizes.recomendedWidth = product.sizes.recomendedWidth;
        }

        if (product.frameTreshold !== undefined) productInput.frameTreshold = product.frameTreshold;
        if (product.framePainting !== undefined) productInput.framePainting = product.framePainting;
        if (product.customProductCostNetto !== undefined) productInput.customProductCostNetto = product.customProductCostNetto;
        if (product.comment !== undefined) productInput.comment = product.comment;
        if (product.knobOpen !== undefined) productInput.knobOpen = product.knobOpen;

        // Создаем новый продукт подзаказа
        try {
        //   console.log(`Creating new suborder product with input:`, JSON.stringify(productInput, null, 2));
          const productResult = await client.mutate({
            mutation: CREATE_SUBORDER_PRODUCT,
            variables: { data: productInput }
          });
          console.log(`Product created with ID: ${productResult.data.createSuborderProduct.documentId}`);
        } catch (productError) {
          console.error("Error creating suborder product:", productError);
        //   console.log("Failed product input:", JSON.stringify(productInput, null, 2));
        }
      }
    } else {
    //   console.log('No products to clone');
    }

    messageApi.success(translations.suborderCloneSuccess);
    return newSuborderId;
  } catch (error) {
    // console.error("Unexpected error in cloning process:", error);
    messageApi.error(translations.errorCloningSuborder);
    return null;
  }
};
