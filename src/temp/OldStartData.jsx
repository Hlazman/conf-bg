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

const StartData = ({ onDataChange, suborderId }) => {
  const [form] = Form.useForm();
  const { translations } = useContext(LanguageContext);
  
  // Стартовые данные с измененными значениями по умолчанию
  const [isDoubleDoor, setIsDoubleDoor] = useState(false);
  const [doorSide, setDoorSide] = useState("left");  // Изменено с "right" на "left"
  const [doorOpening, setDoorOpening] = useState("inside");  // Изменено с "universal" на "inside"
  
  // Запрос на получение данных субордера
  const { data: suborderData, loading: loadingSuborder, refetch } = useQuery(GET_SUBORDER, {
    variables: { documentId: suborderId },
    skip: !suborderId,
    onCompleted: (data) => {
      if (data && data.suborder) {
        // Устанавливаем значения из полученных данных
        setIsDoubleDoor(data.suborder.double_door || false);
        setDoorSide(data.suborder.side || "left");  // Изменено значение по умолчанию
        setDoorOpening(data.suborder.opening || "inside");  // Изменено значение по умолчанию
        
        // Обновляем форму
        form.setFieldsValue({
          isDoubleDoor: data.suborder.double_door || false,
          doorSide: data.suborder.side || "left",  // Изменено значение по умолчанию
          doorOpening: data.suborder.opening || "inside"  // Изменено значение по умолчанию
        });
      }
    }
  });
  
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
  const handleSubmit = () => {
    if (!suborderId) {
      message.error(translations.suborderIdNotFound);
      return;
    }
    
    const data = {
      double_door: isDoubleDoor,
      side: doorSide,
      opening: doorOpening
    };
    
    updateSuborder({
      variables: {
        documentId: suborderId,
        data: data
      }
    });
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
                <label style={{ marginRight: '16px' }}>{translations.doorSide}:</label>
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
                <label style={{ marginRight: '16px' }}>{translations.doorOpening}:</label>
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
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              {translations.save}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default StartData;