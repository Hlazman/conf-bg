import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

// Подробные сообщения об ошибках в режиме разработки
if (process.env.NODE_ENV !== "production") {
  loadDevMessages();
  loadErrorMessages();
}

const baseUrl = process.env.REACT_APP_BASE_URL;

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
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
  // uri: "https://dev.api.boki-groupe.com/graphql",
  uri: `${baseUrl}/graphql`,
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
      Query: {
        keyFields: false,
        fields: {
          suborder: {
            merge(existing = {}, incoming) {
              return { ...existing, ...incoming };
            }
          }
        }
      },
      Product: { keyFields: false },
      Order: { keyFields: false },
      Suborder: { keyFields: false },
      SuborderProduct: { keyFields: false },
      Agent: { keyFields: false },
      Client: { keyFields: false },
      Company: { keyFields: false },
      SuborderType: { keyFields: false },
      CustomImage: { keyFields: false },
      Decor: { keyFields: false },
      DecorType: { keyFields: false },
      SecondSideDecor: { keyFields: false },
      SecondSideDecorType: { keyFields: false },
      ComponentPropertiesSizes: { keyFields: false },
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "no-cache",
      errorPolicy: "ignore",
    },
    query: {
      fetchPolicy: "no-cache",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all"
    }
  }
});
