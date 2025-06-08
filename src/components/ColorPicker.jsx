import React, { useState, useEffect, useContext } from "react";
import { Input } from "antd";
import ralToHex from 'ral-to-hex';
import ncsColor from 'ncs-color';
import { LanguageContext } from "../context/LanguageContext";
import { Space, Button} from "antd";

// Компонент для выбора цвета по коду RAL или NCS
const ColorPicker = ({ value, onChange, noNCS }) => {
    const [colorCode, setColorCode] = useState(value || "");
    const [colorHex, setColorHex] = useState(null);
    const { translations } = useContext(LanguageContext);

    // Предустановленные RAL коды
    const presetRalCodes = [
      '1013', '1015', '7045', '7047', '9001', 
      '9002', '9003', '9010', '9016', '9018'
    ];
  
    useEffect(() => {
      // Обновляем цвет при изменении кода
      setColorHex(getColorFromCode(colorCode));
    }, [colorCode]);
  
    const handleChange = (e) => {
      const newValue = e.target.value;
      setColorCode(newValue);
      if (onChange) {
        onChange(newValue);
      }
    };

    // Обработчик клика по кнопке RAL
    const handleRalButtonClick = (ralCode) => {
      setColorCode(ralCode);
      if (onChange) {
        onChange(ralCode);
      }
    };
  
    // Функция для определения цвета из кода
    const getColorFromCode = (code) => {
      if (!code) return null;
      
      // Проверяем, является ли код RAL (только 4 цифры)
      if (/^\d{4}$/.test(code)) {
        try {
          const hex = ralToHex(parseInt(code));
          // console.log('RAL code:', code, 'HEX:', hex);
          return hex;
        } catch (error) {
          // console.error('Error converting RAL code:', error);
          return null;
        }
      }
      
      // Проверяем, является ли код NCS
      if (/^NCS/i.test(code)) {
        try {
          const ncsHex = ncsColor.hex(code);
          // console.log('NCS code:', code, 'HEX:', ncsHex);
          return ncsHex;
        } catch (error) {
          // console.error('Error converting NCS code:', error);
          return null;
        }
      }
      
      return null;
    };
  
    return (
      <>
        {/* Кнопки с предустановленными RAL кодами */}
        <div style={{ marginBottom: 30}}>
          <Space wrap size="small">
            {presetRalCodes.map((ralCode) => {
              const backgroundColor = getColorFromCode(ralCode);
              return (
                <Button
                  key={ralCode}
                  size="large"
                  onClick={() => handleRalButtonClick(ralCode)}
                  style={{
                    backgroundColor: backgroundColor || '#f0f0f0',
                    border: colorCode === ralCode ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    color: backgroundColor ? (
                      // Определяем контрастный цвет текста
                      parseInt(backgroundColor.replace('#', ''), 16) > 0xffffff / 2 ? '#000' : '#fff'
                    ) : '#000',
                    minWidth: '50px',
                    height: '32px',
                    padding: '4px 8px'
                  }}
                >
                  {ralCode}
                </Button>
              );
            })}
          </Space>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {noNCS && (<p style={{color: '#ff0000', fontWeight: 'bold'}}>{translations.noNCS}</p>)}
          <Input
              value={colorCode}
              onChange={handleChange}
              placeholder={translations.enterRAL}
              style={{ width: 300, marginBottom: 10 }}
          />
        <div
            style={{
            width: 200,
            height: 200,
            backgroundColor: colorHex || "#f0f0f0",
            border: "1px solid #d9d9d9",
            borderRadius: 4
            }}
            title={colorHex || translations.noColor}
        />
        {colorCode && !colorHex && (
            <div style={{ marginTop: 10, color: 'red' }}>
            {translations.noColor}
            </div>
        )}
        </div>
      </>
    );
  };
  

export default ColorPicker;
