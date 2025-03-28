//////////////////////////////////////////////////////////// getSuborderProductsTitle ///////////////////////////////////////////////
// export const SUBORDER_QUERY = gql`
// query Suborder($documentId: ID!) {
//   suborder(documentId: $documentId) {
//     documentId
//     comment
//     side
//     opening
//     suborder_products {
//       documentId
//       decor_type {
//         documentId
//         typeName
//       }
//       product {
//         documentId
//         title
//         brand
//         image {
//           documentId
//           url
//         }
//       }
//       sizes {
//         height
//         length
//         thickness
//         width
//       }
//       secondSideDecorType {
//         documentId
//         typeName
//         documentId
//       }
//       customTitle
//       type
//     }
//   }
// }
// `;

//////////////////////////////////////////////////////////// OptionSelection ///////////////////////////////////////////////
// const GET_SUBORDER_PRODUCTS = gql`
//   query GetSuborderProducts($filters: SuborderProductFiltersInput) {
//     suborderProducts(filters: $filters) {
//       documentId
//       product {
//         documentId
//         title
//         brand
//         image {
//           url
//           documentId
//         }
//         collections {
//           documentId
//           title
//         }
//       }
//       amount
//     }
//   }
// `;