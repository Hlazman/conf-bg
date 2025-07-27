import React, { useState, useContext } from 'react';
import { Upload, Button, message, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { LanguageContext } from "../context/LanguageContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

const FileUploader = ({ onFileUploaded }) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const { translations } = useContext(LanguageContext);

  const handleUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('files', file);

    try {
      // Получаем JWT токен из localStorage
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const token = user?.jwt;

      if (!token) {
        throw new Error('Token not found');
      }
      
      // https://dev.api.boki-groupe.com/api/upload
      const response = await axios.post(`${baseUrl}/api/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const uploadedFile = response.data[0];
      message.success(`${file.name}: ${translations.dataSaved}`);
      onFileUploaded(uploadedFile);
      setLoading(false);
      return uploadedFile;
    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setLoading(false);
      return null;
    }
  };

  const props = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      const isLt1M = file.size / 1024 / 1024 < 1; // меньше 1 MB
        if (!isLt1M) {
          message.error(`${file.name} ${translations.tooBigImage || 'слишком большой (макс. 1 МБ)'}`);
          return Upload.LIST_IGNORE; // 🚫 не добавлять в fileList
        }

      setFileList([file]);
      return false;
    },
    fileList,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>{translations.selection} {translations.image}</Button>
      </Upload>
      {fileList.length > 0 && (
        <Button
          type="primary"
          onClick={() => handleUpload(fileList[0])}
          disabled={loading}
          style={{ marginTop: 16 }}
        >
          {loading ? <Spin size="small" /> : translations.upload}
        </Button>
      )}
    </div>
  );
};

export default FileUploader;
