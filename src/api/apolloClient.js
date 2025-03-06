// import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// const link = createHttpLink({
//   uri: "https://dev.api.boki-groupe.com/graphql", 
// });

// export const client = new ApolloClient({
//   link,
//   cache: new InMemoryCache(),
// });



import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

// Создаем логирующий middleware для ошибок
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

// Добавляем middleware для вставки токена в заголовки
const authLink = setContext((_, { headers }) => {
  // Получаем токен из localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.jwt;
  
  console.log("User from localStorage:", user);
  console.log("JWT token:", token);
  console.log("Headers being sent:", {
    ...headers,
    authorization: token ? `Bearer ${token}` : "",
  });
  
  // Возвращаем заголовки с токеном авторизации
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

export const client = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
});


