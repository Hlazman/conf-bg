import { gql } from "@apollo/client";

// Запрос для получения documentId ордера по suborderId
const GET_ORDER_DOCUMENT_ID = gql`
query Suborder($documentId: ID!) {
  suborder(documentId: $documentId) {
    documentId # Добавляем прямое получение documentId для Suborder
    order {
      documentId
    }
  }
}

`;

// Запрос для расчёта цены заказа по documentId
const CALCULATE_ORDER_PRICE = gql`
  query CalculateOrderPrice($documentId: String!) {
    calculateOrderPrice(documentId: $documentId) {
      updatedAt
    }
  }
`;

export async function calculateOrderPriceBySuborder(client, suborderId) {
  if (!client || !suborderId) return null;
  try {
    // 1. Получить documentId ордера
    const { data } = await client.query({
      query: GET_ORDER_DOCUMENT_ID,
      variables: { documentId: suborderId },
      fetchPolicy: "network-only",
    });

    const orderDocumentId = data?.suborder?.order?.documentId;

    if (!orderDocumentId) return null;

    // 2. Рассчитать цену заказа
    const { data: priceData } = await client.query({
      query: CALCULATE_ORDER_PRICE,
      variables: { documentId: orderDocumentId },
      fetchPolicy: "network-only",
    });

    return priceData?.calculateOrderPrice || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
