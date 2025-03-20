import React, { createContext, useState, useEffect } from "react";
import { gql, useQuery } from "@apollo/client";

export const CurrencyContext = createContext();

const GET_CURRENCY_RATES = gql`
  query GetCurrencyRates {
    currencyExchangeRates {
      documentId
      name
      rate
    }
  }
`;

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(localStorage.getItem("appCurrency") || "EUR");
  const [rates, setRates] = useState({ EUR: 1 });
  
  const { data } = useQuery(GET_CURRENCY_RATES);
  
  useEffect(() => {
    if (data?.currencyExchangeRates) {
      const ratesObj = { EUR: 1 };
      data.currencyExchangeRates.forEach(item => {
        ratesObj[item.name] = item.rate;
      });
      setRates(ratesObj);
    }
  }, [data]);
  
  useEffect(() => {
    localStorage.setItem("appCurrency", currency);
  }, [currency]);
  
  const convertToEUR = (value, fromCurrency = currency) => {
    if (!value) return 0;
    if (fromCurrency === "EUR") return value;
    // return Math.round(value / rates[fromCurrency]);
    return Number((value / rates[fromCurrency]).toFixed(2));
  };
  
  const convertFromEUR = (value, toCurrency = currency) => {
    if (!value) return 0;
    if (toCurrency === "EUR") return value;
    return Math.round(value * rates[toCurrency]);
    // return Number((value * rates[toCurrency]).toFixed(2));
  };
  
  const getCurrencySymbol = (currencyCode = currency) => {
    return currencyCode === "EUR" ? "€" : "zł";
  };
  
  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      rates, 
      convertToEUR, 
      convertFromEUR,
      getCurrencySymbol 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
