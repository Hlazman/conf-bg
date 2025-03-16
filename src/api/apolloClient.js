// TO CHECK ERRORS WITH CACHE
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    console.log("GraphQL Errors:", graphQLErrors);
  }
  if (networkError) {
    console.log("Network Error:", networkError);
    console.log("Network Error Details:", networkError.result);
    console.log("Operation:", operation);
  }
});

const httpLink = createHttpLink({
  uri: "https://dev.api.boki-groupe.com/graphql", 
});

const authLink = setContext((_, { headers }) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.jwt;
  
  console.log("Headers being sent:", {
    ...headers,
    authorization: token ? `Bearer ${token}` : "",
  });
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

export const client = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache({
    typePolicies: {
      Suborder: {
        keyFields: ["documentId"],
        merge(existing, incoming) {
          return { ...existing, ...incoming };
        }
      },
      SuborderProduct: {
        keyFields: ["documentId"],
        merge(existing, incoming) {
          return { ...existing, ...incoming };
        }
      }
    }
  }),
});

// TO MAIN
// import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
// import { setContext } from "@apollo/client/link/context";

// const httpLink = createHttpLink({
//   uri: "https://dev.api.boki-groupe.com/graphql", 
// });

// const authLink = setContext((_, { headers }) => {
//   const userStr = localStorage.getItem("user");
//   const user = userStr ? JSON.parse(userStr) : null;
//   const token = user?.jwt;
  
//   return {
//     headers: {
//       ...headers,
//       authorization: token ? `Bearer ${token}` : "",
//     }
//   };
// });

// export const client = new ApolloClient({
//   link: authLink.concat(httpLink),
//   cache: new InMemoryCache({
//     typePolicies: {
//       Suborder: {
//         keyFields: ["documentId"],
//         merge(existing, incoming) {
//           return { ...existing, ...incoming };
//         }
//       },
//       SuborderProduct: {
//         keyFields: ["documentId"],
//         merge(existing, incoming) {
//           return { ...existing, ...incoming };
//         }
//       }
//     }
//   }),
// });
