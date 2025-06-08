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
        doorParamsError
        hingeError
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
        'optionError',
        'doorParamsError',
        'hingeError'
      ];
      
      // Возвращаем true, если хотя бы одно поле ошибки равно true
      return errorFields.some(field => data.suborder.suborderErrors[field] === true);
    } catch (error) {
      // console.error(error);
      return false;
    }
  };

// Компонент для отображения алертов об ошибках
const ErrorAlerts = ({ suborderId, onErrorsUpdate }) => {
  const [errorMessages, setErrorMessages] = useState([]);
  const { translations } = useContext(LanguageContext);
  
  // Запрос для получения данных о субордере
  const { data, loading, error, refetch } = useQuery(GET_SUBORDER_ERRORS, { // eslint-disable-line no-unused-vars
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
      messages.push(translations.errAlertDecor);
    }
    
    if (errors.frameError) {
      messages.push(translations.errAlertFrame);
    }
    
    if (errors.extenderError) {
      messages.push(translations.errAlertExtender + " " + translations.doorClickAgain + " " + translations.moveBackProduct);
    }
    
    if (errors.platbandError) {
      messages.push(translations.errAlertPlatband + " " + translations.doorClickAgain);
    }
    
    if (errors.platbandThreadError) {
      messages.push(translations.errAlertPlatbandThreaded + " " + translations.doorClickAgain);
    }
    
    if (errors.platbandFrontError) {
      messages.push(translations.errAlertPlatbandFront+ " " + translations.doorClickAgain);
    }
    
    if (errors.platbandBackError) {
      messages.push(translations.errAlertPlatbandBack+ " " + translations.doorClickAgain);
    }
    
    if (errors.aluminumMoldingError) {
      messages.push(translations.errAlertAlumMolding+ " " + translations.doorClickAgain);
    }
    
    if (errors.aluminumFrameError) {
      messages.push(translations.errAlertAlumFrame+ " " + translations.doorClickAgain);
    }
    
    if (errors.aluminumCladdingError) {
      messages.push(translations.errAlertAlumCladding+ " " + translations.doorClickAgain);
    }
    
    if (errors.optionError) {
      messages.push(translations.errAlertOptions);
    }

    if (errors.doorParamsError) {
      messages.push(translations.errAlertParameters);
    }

    if (errors.hingeError) {
      messages.push(translations.errAlertHinge);
    }
    
    return messages;
  };
  
  // Обновляем сообщения об ошибках при изменении данных
  useEffect(() => {
    if (data && data.suborder) {
      const messages = generateErrorMessages(data.suborder);
      setErrorMessages(messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Обновляем сообщения об ошибках при изменении данных
  useEffect(() => {
    if (data && data.suborder) {
      const messages = generateErrorMessages(data.suborder);
      setErrorMessages(messages);
      
      // Передаем ошибки в родительский компонент через callback
      if (onErrorsUpdate && data.suborder.suborderErrors) {
        onErrorsUpdate(data.suborder.suborderErrors);
      }
    }
  }, [data, onErrorsUpdate]);
  
  // Если нет ошибок или данные загружаются, не отображаем ничего
  if (loading || error || errorMessages.length === 0) {
    return null;
  }
  
  return (
    <div style={{ marginBottom: "20px" }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {errorMessages.map((message, index) => (
          <Alert
            key={index}
            message={translations.errInOrder}
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
