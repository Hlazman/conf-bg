// import React, { useState } from 'react';
// import { Upload, Button, message, Spin } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import axios from 'axios';

// const FileUploader = ({ onFileUploaded }) => {
//   const [loading, setLoading] = useState(false);
//   const [fileList, setFileList] = useState([]);

//   const handleUpload = async (file) => {
//     setLoading(true);
//     const formData = new FormData();
//     formData.append('files', file);

//     try {
//       // Получаем JWT токен из localStorage
//       const userString = localStorage.getItem('user');
//       const user = userString ? JSON.parse(userString) : null;
//       const token = user?.jwt;

//       if (!token) {
//         throw new Error('Токен авторизации не найден');
//       }

//       const response = await axios.post('https://dev.api.boki-groupe.com/upload', formData, {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       const uploadedFile = response.data[0];
//       message.success(`${file.name} успешно загружен`);
//       onFileUploaded(uploadedFile);
//       setLoading(false);
//       return uploadedFile;
//     } catch (error) {
//       message.error(`Ошибка загрузки файла: ${error.message}`);
//       setLoading(false);
//       return null;
//     }
//   };

//   const props = {
//     onRemove: () => {
//       setFileList([]);
//     },
//     beforeUpload: (file) => {
//       setFileList([file]);
//       return false;
//     },
//     fileList,
//   };

//   return (
//     <div style={{ marginBottom: 16 }}>
//       <Upload {...props}>
//         <Button icon={<UploadOutlined />}>Выбрать изображение</Button>
//       </Upload>
//       {fileList.length > 0 && (
//         <Button
//           type="primary"
//           onClick={() => handleUpload(fileList[0])}
//           disabled={loading}
//           style={{ marginTop: 16 }}
//         >
//           {loading ? <Spin size="small" /> : 'Загрузить'}
//         </Button>
//       )}
//     </div>
//   );
// };

// export default FileUploader;


// FileUploader.jsx
import React, { useState } from 'react';
import { Upload, Button, message, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const FileUploader = ({ onFileUploaded }) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('files', file);

    try {
      // Получаем JWT токен из localStorage
      const userString = localStorage.getItem('user');
      console.log('userString:', userString);
      
      const user = userString ? JSON.parse(userString) : null;
      console.log('parsed user object:', user);
      
      const token = user?.jwt;
      console.log('token:', token);

      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      console.log('Sending request to: https://dev.api.boki-groupe.com/api/upload');
      console.log('Headers:', {
        'Authorization': `Bearer ${token}`
      });
      
      const response = await axios.post('https://dev.api.boki-groupe.com/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response:', response);
      const uploadedFile = response.data[0];
      message.success(`${file.name} успешно загружен`);
      onFileUploaded(uploadedFile);
      setLoading(false);
      return uploadedFile;
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      
      message.error(`Ошибка загрузки файла: ${error.message}`);
      setLoading(false);
      return null;
    }
  };

  const props = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      setFileList([file]);
      return false;
    },
    fileList,
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Выбрать изображение</Button>
      </Upload>
      {fileList.length > 0 && (
        <Button
          type="primary"
          onClick={() => handleUpload(fileList[0])}
          disabled={loading}
          style={{ marginTop: 16 }}
        >
          {loading ? <Spin size="small" /> : 'Загрузить'}
        </Button>
      )}
    </div>
  );
};

export default FileUploader;
