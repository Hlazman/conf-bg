// api/calculateOrderPriceBySuborder.js
import { gql } from "@apollo/client";

// Запрос для расчёта цены заказа по documentId
const CALCULATE_ORDER_PRICE = gql`
  query CalculateOrderPrice($documentId: String!) {
    calculateOrderPrice(documentId: $documentId) {
      updatedAt
    }
  }
`;

export async function calculateOrderPrice(client, oderId) {
  try {
    const { data: priceData } = await client.query({
      query: CALCULATE_ORDER_PRICE,
      variables: { documentId: oderId },
      fetchPolicy: "network-only",
    });

    return priceData?.calculateOrderPrice || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
