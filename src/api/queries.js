import { gql } from "@apollo/client";

// GraphQL запрос для получения продуктов (дверей)
export const GET_PRODUCTS = gql`
  query Query($pagination: PaginationArg, $filters: ProductFiltersInput) {
    products(pagination: $pagination, filters: $filters) {
      brand
      collections {
        documentId
        title
      }
      decor_types {
        documentId
        typeName
      }
      documentId
      title
      type
      image {
        url
      }
    }
  }
`;

export const GET_DECOR_TYPES = gql`
  query DecorType($filters: DecorTypeFiltersInput, $pagination: PaginationArg) {
    decorTypes(filters: $filters) {
      documentId
      typeName
      decors(pagination: $pagination) {
        documentId
        title
        image {
          url
        }
        category
      }
      products {
        documentId
      }
    }
  }
`;



// GraphQL запрос для получения декоров определенного типа
export const GET_DECORS = gql`
  query GetDecors($filters: DecorFiltersInput, $pagination: PaginationArg) {
    decors(filters: $filters, pagination: $pagination) {
      documentId
      title
      image {
        url
      }
      category
      decor_type {
        documentId
        typeName
      }
    }
  }
`;

// Добавьте этот запрос в файл queries.js
export const GET_FRAMES = gql`
  query GetFrames($filters: ProductFiltersInput) {
    products(filters: $filters) {
      documentId
      title
      type
      image {
        url
      }
      collections {
        documentId
        title
      }
    }
  }
`;

