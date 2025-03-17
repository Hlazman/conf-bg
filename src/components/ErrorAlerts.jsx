import React, { useState, useEffect, useContext } from "react";
import { Alert, Space } from "antd";
import { useQuery, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

// GraphQL запрос для получения данных о субордере
const GET_SUBORDER_ERRORS = gql`
  query Suborder($documentId: ID!) {
    suborder(documentId: $documentId) {
      documentId
      suborderErrors {
        aluminumCladdingError
        aluminumFrameError
        aluminumMoldingError
        decorError
        extenderError
        frameError
        optionError
        platbandBackError
        platbandError
        platbandFrontError
        platbandThreadError
      }
    }
  }
`;

// Функция для проверки наличия ошибок в субордере
export const checkSuborderErrors = async (client, suborderId) => {
    if (!suborderId) return false;
    
    try {
      const { data } = await client.query({
        query: GET_SUBORDER_ERRORS,
        variables: { documentId: suborderId },
        fetchPolicy: "network-only"
      });
      
      if (!data || !data.suborder || !data.suborder.suborderErrors) return false;
      
      // Проверяем все поля ошибок
      const errorFields = [
        'decorError',
        'frameError',
        'extenderError',
        'platbandError',
        'platbandThreadError',
        'platbandFrontError',
        'platbandBackError',
        'aluminumMoldingError',
        'aluminumFrameError',
        'aluminumCladdingError',
        'optionError'
      ];
      
      // Возвращаем true, если хотя бы одно поле ошибки равно true
      return errorFields.some(field => data.suborder.suborderErrors[field] === true);
    } catch (error) {
      console.error("Ошибка при проверке ошибок субордера:", error);
      return false;
    }
  };

// Компонент для отображения алертов об ошибках
const ErrorAlerts = ({ suborderId }) => {
  const [errorMessages, setErrorMessages] = useState([]);
  const { translations } = useContext(LanguageContext);
  
  // Запрос для получения данных о субордере
  const { data, loading, error, refetch } = useQuery(GET_SUBORDER_ERRORS, {
    variables: { documentId: suborderId },
    skip: !suborderId,
    fetchPolicy: "network-only",
    pollInterval: 5000 // Опрашиваем сервер каждые 5 секунд для обновления статуса ошибок
  });
  
  // Функция для формирования сообщений об ошибках
  const generateErrorMessages = (suborder) => {
    const messages = [];
    const errors = suborder.suborderErrors;
    
    if (!errors) return messages;
    
    if (errors.decorError) {
      messages.push("Ошибка в выборе декора. Пожалуйста, проверьте выбор декора для лицевой и тыльной стороны.");
    }
    
    if (errors.frameError) {
      messages.push("Ошибка в выборе рамы. Пожалуйста, проверьте выбор рамы.");
    }
    
    if (errors.extenderError) {
      messages.push("Ошибка в выборе расширителя. Пожалуйста, проверьте выбор расширителя.");
    }
    
    if (errors.platbandError) {
      messages.push("Ошибка в выборе наличника. Пожалуйста, проверьте выбор наличника.");
    }
    
    if (errors.platbandThreadError) {
      messages.push("Ошибка в выборе наличника с резьбой. Пожалуйста, проверьте выбор наличника с резьбой.");
    }
    
    if (errors.platbandFrontError) {
      messages.push("Ошибка в выборе наличника лицевой стороны. Пожалуйста, проверьте выбор наличника лицевой стороны.");
    }
    
    if (errors.platbandBackError) {
      messages.push("Ошибка в выборе наличника тыльной стороны. Пожалуйста, проверьте выбор наличника тыльной стороны.");
    }
    
    if (errors.aluminumMoldingError) {
      messages.push("Ошибка в выборе алюминиевого молдинга. Пожалуйста, проверьте выбор алюминиевого молдинга.");
    }
    
    if (errors.aluminumFrameError) {
      messages.push("Ошибка в выборе алюминиевого обклада. Пожалуйста, проверьте выбор алюминиевого обклада.");
    }
    
    if (errors.aluminumCladdingError) {
      messages.push("Ошибка в выборе алюминиевого каркаса. Пожалуйста, проверьте выбор алюминиевого каркаса.");
    }
    
    if (errors.optionError) {
      messages.push("Ошибка в выборе опций. Пожалуйста, проверьте выбор опций.");
    }
    
    return messages;
  };
  
  // Обновляем сообщения об ошибках при изменении данных
  useEffect(() => {
    if (data && data.suborder) {
      const messages = generateErrorMessages(data.suborder);
      setErrorMessages(messages);
    }
  }, [data]);
  
  // Если нет ошибок или данные загружаются, не отображаем ничего
  if (loading || error || errorMessages.length === 0) {
    return null;
  }
  
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 1000, marginBottom: "20px" }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {errorMessages.map((message, index) => (
          <Alert
            key={index}
            message="Ошибка в заказе"
            description={message}
            type="error"
            showIcon
            banner
          />
        ))}
      </Space>
    </div>
  );
};

export default ErrorAlerts;
