import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

// Подробные сообщения об ошибках в режиме разработки
if (process.env.NODE_ENV !== "production") {
  loadDevMessages();
  loadErrorMessages();
}

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
        fields: {
          suborder_products: {
            merge(existing = {}, incoming) {
              return { ...existing, ...incoming };
            }
          }
        },
        merge(existing, incoming) {
          return { ...existing, ...incoming };
        }
      },
      SuborderProduct: {
        keyFields: ["documentId"],
        merge(existing, incoming) {
          return { ...existing, ...incoming };
        }
      },
    }
  }),
})

