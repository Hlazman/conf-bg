import { gql } from "@apollo/client";

// Запрос для получения подзаказа с его продуктами
export const GET_SUBORDER = gql`
  query Suborder($documentId: ID!) {
    suborder(documentId: $documentId) {
      documentId
      suborder_products {
        documentId
      }
    }
  }
`;

// Мутация для удаления продукта подзаказа
export const DELETE_SUBORDER_PRODUCT = gql`
  mutation DeleteSuborderProduct($documentId: ID!) {
    deleteSuborderProduct(documentId: $documentId) {
      documentId
    }
  }
`;

// Мутация для удаления подзаказа
export const DELETE_SUBORDER = gql`
  mutation DeleteSuborder($documentId: ID!) {
    deleteSuborder(documentId: $documentId) {
      documentId
    }
  }
`;

// Мутация для удаления заказа
export const DELETE_ORDER = gql`
  mutation DeleteOrder($documentId: ID!) {
    deleteOrder(documentId: $documentId) {
      documentId
    }
  }
`;

// Функция для удаления подзаказа и всех связанных с ним продуктов
export const deleteSuborderWithProducts = async (suborderId, client, messageApi, translations) => {
  try {
    // Получаем информацию о подзаказе и его продуктах
    const { data: suborderData } = await client.query({
      query: GET_SUBORDER,
      variables: { documentId: suborderId }
    });

    // Удаляем все продукты подзаказа
    if (suborderData?.suborder?.suborder_products?.length > 0) {
      for (const product of suborderData.suborder.suborder_products) {
        await client.mutate({
          mutation: DELETE_SUBORDER_PRODUCT,
          variables: { documentId: product.documentId }
        });
      }
    }

    // Удаляем сам подзаказ
    await client.mutate({
      mutation: DELETE_SUBORDER,
      variables: { documentId: suborderId }
    });

    return true;
  } catch (error) {
    messageApi.error(translations.errDeleteSubOrder);
    console.error("Error deleting suborder with products:", error);
    return false;
  }
};

// Функция для удаления заказа со всеми подзаказами и их продуктами
export const deleteOrderWithSuborders = async (orderId, orders, client, messageApi, translations) => {
  try {
    // Находим заказ по ID
    const orderToDelete = orders.find(order => order.documentId === orderId);
    
    // Удаляем все подзаказы и их продукты
    if (orderToDelete?.suborders?.length > 0) {
      for (const suborder of orderToDelete.suborders) {
        await deleteSuborderWithProducts(suborder.documentId, client, messageApi, translations);
      }
    }

    // Удаляем сам заказ
    await client.mutate({
      mutation: DELETE_ORDER,
      variables: { documentId: orderId }
    });

    messageApi.success(translations.ordersNsubordersDel);
    return true;
  } catch (error) {
    messageApi.error(translations.errDeleteOrder);
    console.error("Error deleting order with suborders:", error);
    return false;
  }
};
