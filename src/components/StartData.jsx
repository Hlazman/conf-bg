import React, { useState, useEffect, useContext } from "react";
import { Form, Radio, Button, message, Space } from "antd";
import { gql, useMutation, useQuery } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

// GraphQL запрос для обновления субордера
const UPDATE_SUBORDER = gql`
  mutation UpdateSuborder($documentId: ID!, $data: SuborderInput!) {
    updateSuborder(documentId: $documentId, data: $data) {
      documentId
    }
  }
`;

// GraphQL запрос для получения данных субордера
const GET_SUBORDER = gql`
  query GetSuborder($documentId: ID!) {
    suborder(documentId: $documentId) {
      documentId
      double_door
      side
      opening
    }
  }
`;

const StartData = ({ onDataChange, suborderId, onAfterSubmit }) => {
  const [form] = Form.useForm();
  const { translations } = useContext(LanguageContext);
  
  // Стартовые данные с измененными значениями по умолчанию
  const [isDoubleDoor, setIsDoubleDoor] = useState(false);
  const [doorSide, setDoorSide] = useState();
  const [doorOpening, setDoorOpening] = useState();
  
  // Запрос на получение данных субордера
  const { data: suborderData, loading: loadingSuborder, refetch } = useQuery(GET_SUBORDER, {
    variables: { documentId: suborderId },
    skip: !suborderId,
    fetchPolicy: "network-only" // Добавляем fetchPolicy для обновления данных с сервера
  });
  
  // Используем useEffect для обработки данных после получения
  useEffect(() => {
    if (suborderData && suborderData.suborder) {
      // Устанавливаем значения из полученных данных
      setIsDoubleDoor(suborderData.suborder.double_door || false);
      setDoorSide(suborderData.suborder.side);
      setDoorOpening(suborderData.suborder.opening);
      
      // Обновляем форму
      form.setFieldsValue({
        isDoubleDoor: suborderData.suborder.double_door || false,
        doorSide: suborderData.suborder.side,
        doorOpening: suborderData.suborder.opening
      });
    }
  }, [suborderData, form]);
  
  // Мутация для обновления субордера
  const [updateSuborder, { loading: updating }] = useMutation(UPDATE_SUBORDER, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      // Выполняем повторный запрос для обновления данных
      refetch();
    },
    onError: (error) => {
      message.error(`${translations.saveError}: ${error.message}`);
    }
  });

  // Эффект для отправки изменений в родительский компонент
  useEffect(() => {
    if (onDataChange) {
      const startData = {
        isDoubleDoor,
        doorSide,
        doorOpening
      };
      
      onDataChange(startData);
    }
  }, [isDoubleDoor, doorSide, doorOpening, onDataChange]);

  // Обработчики изменений
  const handleDoubleDoorChange = (e) => {
    setIsDoubleDoor(e.target.value);
  };

  const handleDoorSideChange = (e) => {
    setDoorSide(e.target.value);
  };

  const handleDoorOpeningChange = (e) => {
    setDoorOpening(e.target.value);
  };
  
  // Обработчик отправки формы
  const handleSubmit = async () => {
    if (!suborderId) {
      message.error(translations.suborderIdNotFound);
      return;
    }
    
    // Проверяем обязательные поля
    if (!doorSide) {
      message.error(`${translations.doorSide} ${translations.isRequired}`);
      return;
    }
    
    if (!doorOpening) {
      message.error(`${translations.doorOpening} ${translations.isRequired}`);
      return;
    }
    
    const data = {
      double_door: isDoubleDoor,
      side: doorSide,
      opening: doorOpening
    };
    
    await updateSuborder({
      variables: {
        documentId: suborderId,
        data: data
      }
    });

    // Update title in collapse
    if (onAfterSubmit) {
      await onAfterSubmit();
    }
  };

  return (
    <div>
      {loadingSuborder ? (
        <div>{translations.loading}</div>
      ) : (
        <Form form={form} initialValues={{ isDoubleDoor, doorSide, doorOpening }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', marginTop: '16px' }}>
            <Space size="large">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: '16px' }}>{translations.doubleDoor}:</label>
                <Radio.Group
                  value={isDoubleDoor}
                  onChange={handleDoubleDoorChange}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value={false}>{translations.no}</Radio.Button>
                  <Radio.Button value={true}>{translations.yes}</Radio.Button>
                </Radio.Group>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: '16px', color: doorSide ? 'inherit' : 'red' }}>{translations.doorSide}:*</label>
                <Radio.Group
                  value={doorSide}
                  onChange={handleDoorSideChange}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="left">{translations.leftSide}</Radio.Button>
                  <Radio.Button value="right">{translations.rightSide}</Radio.Button>
                </Radio.Group>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: '16px', color: doorOpening ? 'inherit' : 'red' }}>{translations.doorOpening}:*</label>
                <Radio.Group
                  value={doorOpening}
                  onChange={handleDoorOpeningChange}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="inside">{translations.inside}</Radio.Button>
                  <Radio.Button value="outside">{translations.outside}</Radio.Button>
                  <Radio.Button value="universal">{translations.universal}</Radio.Button>
                </Radio.Group>
              </div>
            </Space>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={updating}
              disabled={!suborderId}
              style={!doorSide && !doorOpening ? {} : { backgroundColor: '#52C41A' }}
            >
              {/* {translations.save} */}
              {doorSide && doorOpening ? translations.update : translations.save}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default StartData;


