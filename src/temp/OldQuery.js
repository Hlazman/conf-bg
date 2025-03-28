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


//////////////////////////////////////////////////////////// SampleSelection ///////////////////////////////////////////////
// // Запрос для получения образцов
// const GET_SAMPLES = gql`
// query Products($filters: ProductFiltersInput) {
//   products(filters: $filters) {
//     documentId
//     title
//     type
//     brand
//     image {
//       url
//       documentId
//     }
//   }
// }`;

// // Мутация для создания SuborderProduct
// const CREATE_SUBORDER_PRODUCT = gql`
// mutation CreateSuborderProduct($data: SuborderProductInput!) {
//   createSuborderProduct(data: $data) {
//     documentId
//     product {
//       documentId
//       title
//       brand
//       image {
//         url
//         documentId
//       }
//     }
//     colorCode
//   }
// }`;

// // Мутация для обновления SuborderProduct
// const UPDATE_SUBORDER_PRODUCT = gql`
// mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
//   updateSuborderProduct(documentId: $documentId, data: $data) {
//     documentId
//     product {
//       documentId
//       title
//       brand
//       image {
//         url
//         documentId
//       }
//     }
//     colorCode
//   }
// }`;

// // Запрос для получения существующих SuborderProduct
// const GET_SUBORDER_PRODUCTS = gql`
// query GetSuborderProducts($filters: SuborderProductFiltersInput) {
//   suborderProducts(filters: $filters) {
//     documentId
//     product {
//       documentId
//       title
//       brand
//       image {
//         url
//         documentId
//       }
//     }
//     colorCode
//     decor {
//       documentId
//       title
//     }
//     decor_type {
//       documentId
//       typeName
//     }
//   }
// }`;