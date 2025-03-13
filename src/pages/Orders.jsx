import React, { useState, useEffect } from "react";
import { Table, Dropdown, Button, Modal, message, Space, Popconfirm } from "antd";
import { 
  MenuOutlined, 
  EyeOutlined, 
  EditOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  FileTextOutlined,
  CopyOutlined 
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { gql, useQuery, useMutation } from "@apollo/client";

export const GET_ORDERS = gql`
  query GetOrders($filters: OrderFiltersInput, $pagination: PaginationArg, $suborderFilters: SuborderProductFiltersInput) {
    orders(filters: $filters, pagination: $pagination) {
      documentId
      orderNumber
      totalCostNetto
      totalCostBrutto
      taxRate
      deliveryCost
      clientDiscount
      clientExtraPay
      agent {
        name
      }
      client {
        name
      }
      comment
      createdAt
      suborders {
        documentId
        suborder_type {
          typeName
        }
        suborder_products(filters: $suborderFilters) {
          documentId
          product {
            title
          }
        }
      }
    }
  }
`;

const CREATE_SUBORDER = gql`
  mutation CreateSuborder($data: SuborderInput!) {
    createSuborder(data: $data) {
      documentId
    }
  }
`;

const DELETE_SUBORDER = gql`
  mutation DeleteSuborder($documentId: ID!) {
    deleteSuborder(documentId: $documentId) {
      documentId
    }
  }
`;

const DELETE_ORDER = gql`
  mutation DeleteOrder($documentId: ID!) {
    deleteOrder(documentId: $documentId) {
      documentId
    }
  }
`;


const Orders = () => {
  const [commentModal, setCommentModal] = useState({ open: false, text: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany"));
  
  const { data, loading, refetch } = useQuery(GET_ORDERS, {
    variables: { 
      filters: { 
        company: { 
          documentId: { 
            eqi: selectedCompany?.documentId 
          } 
        } 
      },
      pagination: {
        limit: 1000
      },
      suborderFilters: {
        product: {
          type: {
            in: ["door", "hiddenDoor", "samples", "slidingDoor", "wallPanel"]
          }
        }
      }
    },
    skip: !selectedCompany?.documentId,
  });

  // Проверяем, вернулись ли мы с другой страницы
  useEffect(() => {
    // Обновляем данные при возвращении на страницу
    refetch();
  }, [location.pathname, refetch]);

  const [createSuborder, { loading: creatingSuborder }] = useMutation(CREATE_SUBORDER, {
    refetchQueries: [
      {
        query: GET_ORDERS,
        variables: { 
          filters: { 
            company: { 
              documentId: { 
                eqi: selectedCompany?.documentId 
              } 
            } 
          },
          pagination: {
            limit: 1000
          },
          suborderFilters: {
            product: {
              type: {
                in: ["door", "hiddenDoor", "samples", "slidingDoor", "wallPanel"]
              }
            }
          }
        }
      }
    ]
  });

  const [deleteSuborder, { loading: deletingSuborder }] = useMutation(DELETE_SUBORDER, {
    refetchQueries: [
      {
        query: GET_ORDERS,
        variables: { 
          filters: { 
            company: { 
              documentId: { 
                eqi: selectedCompany?.documentId 
              } 
            } 
          },
          pagination: {
            limit: 1000
          },
          suborderFilters: {
            product: {
              type: {
                in: ["door", "hiddenDoor", "samples", "slidingDoor", "wallPanel"]
              }
            }
          }
        }
      }
    ]
  });
  
  const [deleteOrder, { loading: deletingOrder }] = useMutation(DELETE_ORDER, {
    refetchQueries: [
      {
        query: GET_ORDERS,
        variables: { 
          filters: { 
            company: { 
              documentId: { 
                eqi: selectedCompany?.documentId 
              } 
            } 
          },
          pagination: {
            limit: 1000
          },
          suborderFilters: {
            product: {
              type: {
                in: ["door", "hiddenDoor", "samples", "slidingDoor", "wallPanel"]
              }
            }
          }
        }
      }
    ]
  });

  
  const orders = React.useMemo(() => {
    if (!data?.orders) return [];
    return [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data]);

  const handleEdit = (record) => {
    navigate(`/edit-order/${record.documentId}`);
  };

  const handleInteriorClick = async (record) => {
    try {
      const { data: suborderData } = await createSuborder({
        variables: {
          data: {
            hidden: false,
            order: record.documentId,
            suborder_type: 2
          }
        }
      });
      
      // Сохраняем ID субордера в localStorage для надежности
      localStorage.setItem('currentSuborderId', suborderData.createSuborder.documentId);
      localStorage.setItem('currentType', "door");
      
      
      // После успешного создания Suborder переходим на страницу CreateProduct
      navigate(`/create-product`, { 
        state: { 
          orderId: record.documentId,
          suborderId: suborderData.createSuborder.documentId,
          // type: "interior" 
          type: "door" 
        } 
      });
    } catch (error) {
      message.error("Ошибка при создании подзаказа");
      console.error("Error creating suborder:", error);
    }
  };

////////////////////////////////////////// HIDDEN DOORS //////////////////////////////////////////
  const handleHiddenDoorClick = async (record) => {
    try {
      const { data: suborderData } = await createSuborder({
        variables: {
          data: {
            hidden: true,
            order: record.documentId,
            suborder_type: 11 // ID для типа hiddenDoor
          }
        }
      });
  
      // Сохраняем ID субордера в localStorage
      localStorage.setItem('currentSuborderId', suborderData.createSuborder.documentId);
      localStorage.setItem('currentType', "hiddenDoor");
  
      // Переходим на страницу CreateProduct
      navigate(`/create-product`, {
        state: {
          orderId: record.documentId,
          suborderId: suborderData.createSuborder.documentId,
          type: "hiddenDoor"
        }
      });
    } catch (error) {
      message.error("Ошибка при создании подзаказа");
      console.error("Error creating suborder:", error);
    }
  };
////////////////////////////////////////// HIDDEN DOORS //////////////////////////////////////////

////////////////////////////////////////// SLIDING DOORS //////////////////////////////////////////
const handleSlidingDoorClick = async (record) => {
  try {
    const { data: suborderData } = await createSuborder({
      variables: {
        data: {
          hidden: false,
          order: record.documentId,
          suborder_type: 12 // ID для типа slidingDoor
        }
      }
    });

    // Сохраняем ID субордера в localStorage
    localStorage.setItem('currentSuborderId', suborderData.createSuborder.documentId);
    localStorage.setItem('currentType', "sliding");

    // Переходим на страницу CreateProduct
    navigate(`/create-product`, {
      state: {
        orderId: record.documentId,
        suborderId: suborderData.createSuborder.documentId,
        type: "slidingDoor"
      }
    });
  } catch (error) {
    message.error("Ошибка при создании подзаказа");
    console.error("Error creating suborder:", error);
  }
};
////////////////////////////////////////// SLIDING DOORS //////////////////////////////////////////

  // const handleEditSuborder = (suborderId, orderId) => {
  //   // Сохраняем ID субордера в localStorage для надежности
  //   localStorage.setItem('currentSuborderId', suborderId);
    
  //   // Переходим на страницу CreateProduct с передачей state
  //   navigate(`/create-product`, { 
  //     state: { 
  //       orderId: orderId,
  //       suborderId: suborderId,
  //       // type: "interior",
  //       type: "door",
  //       isEditing: true // Флаг для определения режима редактирования
  //     } 
  //   });
  // };

  const handleEditSuborder = (suborderId, orderId) => {
    // Сохраняем ID субордера в localStorage для надежности
    localStorage.setItem('currentSuborderId', suborderId);
    
    // Находим заказ по orderId
    const order = orders.find(order => order.documentId === orderId);
    
    // Находим подзаказ по suborderId
    const suborder = order?.suborders?.find(sub => sub.documentId === suborderId);
    
    // Определяем тип подзаказа на основе suborder_type.typeName
    let type = "door"; // По умолчанию
    let currentType = "door"; // По умолчанию для localStorage
    
    if (suborder?.suborder_type) {
      const typeName = suborder.suborder_type.typeName?.toLowerCase();
      
      if (typeName.includes("скрыт") || typeName.includes("hidden")) {
        type = "hiddenDoor";
        currentType = "hiddenDoor";
      } else if (typeName.includes("раздвиж") || typeName.includes("sliding")) {
        type = "slidingDoor";
        currentType = "sliding";
      } else {
        type = "door";
        currentType = "door";
      }
    }
    
    // Сохраняем тип в localStorage, как это делается в других функциях
    localStorage.setItem('currentType', currentType);
    
    // Переходим на страницу CreateProduct с передачей state
    navigate(`/create-product`, { 
      state: { 
        orderId: orderId,
        suborderId: suborderId,
        type: type,
        isEditing: true // Флаг для определения режима редактирования
      } 
    });
  };

  const handleCloneSuborder = (suborderId) => {
    // Логика клонирования suborder
    console.log("Clone suborder:", suborderId);
  };

  const handleDeleteSuborder = async (suborderId) => {
    try {
      await deleteSuborder({
        variables: {
          documentId: suborderId
        }
      });
      message.success("Подзаказ успешно удален");
    } catch (error) {
      message.error("Ошибка при удалении подзаказа");
      console.error("Error deleting suborder:", error);
    }
  };
  
  
  const handleDeleteOrder = async (orderId) => {
    try {
      // Получаем все субордеры для этого ордера
      const orderToDelete = orders.find(order => order.documentId === orderId);
      
      // Сначала удаляем все субордеры
      if (orderToDelete && orderToDelete.suborders && orderToDelete.suborders.length > 0) {
        for (const suborder of orderToDelete.suborders) {
          await deleteSuborder({
            variables: {
              documentId: suborder.documentId
            }
          });
        }
      }
      
      // Затем удаляем сам ордер
      await deleteOrder({
        variables: {
          documentId: orderId
        }
      });
      
      message.success("Заказ и все его подзаказы успешно удалены");
      refetch();
    } catch (error) {
      message.error("Ошибка при удалении заказа");
      console.error("Error deleting order:", error);
    }
  };

  const menu = (record) => ({
    items: [
      { key: "view", label: "Посмотреть", icon: <EyeOutlined /> },
      { key: "edit", label: "Изменить", icon: <EditOutlined />, onClick: () => handleEdit(record) },
      {
        key: "add",
        label: "Добавить",
        icon: <PlusOutlined />,
        children: [
          // { key: "hidden", label: "Скрытые двери" },
          { 
            key: "hiddenDoor", 
            label: "Скрытые двери", 
            icon: <FileTextOutlined />, 
            onClick: () => handleHiddenDoorClick(record) 
          },
          { 
            // key: "interior", 
            key: "door", 
            label: "Межкомнатные двери", 
            onClick: () => handleInteriorClick(record)
          },
          { 
            key: "slidingDoor", 
            label: "Раздвижные двери", 
            icon: <FileTextOutlined />, 
            onClick: () => handleSlidingDoorClick(record) 
          },
          { key: "wall_panels", label: "Настенные панели" },
        ],
      },
      { 
        key: "delete", 
        label: (
          <Popconfirm
            title="Вы уверены, что хотите удалить этот заказ?"
            description="При удалении заказа будут также удалены все связанные с ним подзаказы"
            onConfirm={() => handleDeleteOrder(record.documentId)}
            okText="Да"
            cancelText="Нет"
            okButtonProps={{ danger: true }}
          >
            <span>
              <DeleteOutlined /> Удалить
            </span>
          </Popconfirm>
        ),
        danger: true
      }
    ],
  });

  const expandedRowRender = (record) => {
    if (!record.suborders || record.suborders.length === 0) {
      return <p>Нет подзаказов</p>;
    }

    const suborderColumns = [
      { 
        title: '№', 
        key: 'subIndex', 
        width: 60,
        render: (_, __, index) => index + 1 
      },
      { 
        title: 'Тип подзаказа', 
        dataIndex: 'suborder_type', 
        key: 'typeName',
        render: (suborder_type) => suborder_type?.typeName || '-'
      },
      { 
        title: 'Продукты', 
        dataIndex: 'suborder_products', 
        key: 'products',
        render: (suborder_products) => {
          if (!suborder_products || suborder_products.length === 0) return '-';
          return suborder_products.map(item => item.product?.title).join(', ');
        }
      },
      {
        title: 'Действия',
        key: 'action',
        render: (_, suborder) => (
          <Space size="middle">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              size="small"
              // onClick={() => handleEditSuborder(suborder.documentId)}
              onClick={() => handleEditSuborder(suborder.documentId, record.documentId)}
            >
              Изменить
            </Button>
            <Button 
              icon={<CopyOutlined />} 
              size="small"
              onClick={() => handleCloneSuborder(suborder.documentId)}
            >
              Клонировать
            </Button>
            <Popconfirm
              title="Вы уверены, что хотите удалить этот подзаказ?"
              onConfirm={() => handleDeleteSuborder(suborder.documentId)}
              okText="Да"
              cancelText="Нет"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
                loading={deletingSuborder}
              >
                Удалить
              </Button>
            </Popconfirm>
          </Space>
        ),
      }
    ];

    return (
      <Table
        columns={suborderColumns}
        dataSource={record.suborders}
        pagination={false}
        rowKey="documentId"
      />
    );
  };

  const columns = [
    { title: "№", key: "index", width: 60, render: (_, __, index) => index + 1, fixed: "left"},
    { title: "Order number", dataIndex: "orderNumber", key: "orderNumber", fixed: "left" },
    { title: "Стоимость Netto", dataIndex: "totalCostNetto", key: "totalCostNetto" },
    { title: "Стоимость Brutto", dataIndex: "totalCostBrutto", key: "totalCostBrutto" },
    { title: "Налог", dataIndex: "taxRate", key: "taxRate" },
    { title: "Доставка", dataIndex: "deliveryCost", key: "deliveryCost" },
    { title: "Скидка", dataIndex: "clientDiscount", key: "clientDiscount" },
    { title: "Доп. плата клиента", dataIndex: "clientExtraPay", key: "clientExtraPay" },
    { 
      title: "Агент", 
      dataIndex: "agent", 
      key: "agent",
      render: (agent) => agent?.name || "-"
    },
    { 
      title: "Клиент", 
      dataIndex: "client", 
      key: "client",
      render: (client) => client?.name || "-"
    },
    {
      title: "Комментарий",
      dataIndex: "comment",
      key: "comment",
      render: (text) =>
        text ? (
          <Button type="link" icon={<FileTextOutlined style={{ fontSize: "20px" }} />} onClick={() => setCommentModal({ open: true, text })} />
        ) : null,
    },
    {
      title: "Действия",
      key: "actions",
      fixed: "right",
      render: (record) => (
        <Dropdown menu={menu(record)} trigger={["click"]}>
          <Button loading={creatingSuborder || deletingOrder}>
            <MenuOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];

  // Определяем, у каких заказов есть подзаказы для отображения иконки раскрытия
  const rowExpandable = (record) => {
    return record.suborders && record.suborders.length > 0;
  };

  return (
    <>
      <Button onClick={() => refetch()} style={{ marginBottom: 16 }}>
        Обновить данные
      </Button>
      <Table 
        dataSource={orders} 
        columns={columns} 
        loading={loading} 
        rowKey="documentId" 
        scroll={{ x: 1300 }}
        expandable={{
          expandedRowRender,
          rowExpandable,
        }}
      />
      <Modal open={commentModal.open} footer={null} onCancel={() => setCommentModal({ open: false, text: "" })}>
        <p>{commentModal.text}</p>
      </Modal>
    </>
  );
};

export default Orders;
