import React, { useState, useEffect } from "react";
import { Input } from "antd";
import ralToHex from 'ral-to-hex';
import ncsColor from 'ncs-color';

// Компонент для выбора цвета по коду RAL или NCS
const ColorPicker = ({ value, onChange }) => {
    const [colorCode, setColorCode] = useState(value || "");
    const [colorHex, setColorHex] = useState(null);
  
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
  
    // Функция для определения цвета из кода
    const getColorFromCode = (code) => {
      if (!code) return null;
      
      // Проверяем, является ли код RAL (только 4 цифры)
      if (/^\d{4}$/.test(code)) {
        try {
          const hex = ralToHex(parseInt(code));
          console.log('RAL code:', code, 'HEX:', hex);
          return hex;
        } catch (error) {
          console.error('Ошибка при конвертации RAL кода:', error);
          return null;
        }
      }
      
      // Проверяем, является ли код NCS
      if (/^NCS/i.test(code)) {
        try {
          const ncsHex = ncsColor.hex(code);
          console.log('NCS code:', code, 'HEX:', ncsHex);
          return ncsHex;
        } catch (error) {
          console.error('Ошибка при конвертации NCS кода:', error);
          return null;
        }
      }
      
      return null;
    };
  
    return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Input
            value={colorCode}
            onChange={handleChange}
            placeholder="Введите код RAL (4 цифры) или NCS"
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
        title={colorHex || "Цвет не определен"}
    />
    {colorCode && !colorHex && (
        <div style={{ marginTop: 10, color: 'red' }}>
        Цвет не найден
        </div>
    )}
    </div>
    );
  };
  

export default ColorPicker;
