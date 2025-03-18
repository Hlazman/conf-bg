import React, { useState, useEffect, useContext } from "react";
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
import { LanguageContext } from "../context/LanguageContext";

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
  const { translations } = useContext(LanguageContext);
  
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
      message.error(translations.errCreateSubOrder);
      console.error("Error creating suborder:", error);
    }
  };

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
      message.error(translations.errCreateSubOrder);
      console.error("Error creating suborder:", error);
    }
  };

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
    // localStorage.setItem('currentType', "sliding");
    localStorage.setItem('currentType', "slidingDoor");

    // Переходим на страницу CreateProduct
    navigate(`/create-product`, {
      state: {
        orderId: record.documentId,
        suborderId: suborderData.createSuborder.documentId,
        type: "slidingDoor"
      }
    });
  } catch (error) {
    message.error(translations.errCreateSubOrder);
    console.error("Error creating suborder:", error);
  }
};

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
      const typeName = suborder.suborder_type.typeName;
      
      if (typeName.includes("hidden")) {
        type = "hiddenDoor";
        currentType = "hiddenDoor";
      } else if (typeName.includes("slidingDoor")) {
        type = "slidingDoor";
        currentType = "slidingDoor";
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
      message.success(translations.suborderSucDel);
    } catch (error) {
      message.error(translations.errDeleteSubOrder);
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
      
      message.success(translations.ordersNsubordersDel);
      refetch();
    } catch (error) {
      message.error(translations.errDeleteOrder);
      console.error("Error deleting order:", error);
    }
  };

  const menu = (record) => ({
    items: [
      { key: "view", label: translations.view, icon: <EyeOutlined /> },
      { key: "edit", label: translations.edit, icon: <EditOutlined />, onClick: () => handleEdit(record) },
      {
        key: "add",
        label: translations.add,
        icon: <PlusOutlined />,
        children: [
          { 
            key: "hiddenDoor", 
            label: translations.hiDoor, 
            // icon: <FileTextOutlined />, 
            onClick: () => handleHiddenDoorClick(record) 
          },
          { 
            // key: "interior", 
            key: "door", 
            label: translations.inDoor, 
            onClick: () => handleInteriorClick(record)
          },
          { 
            key: "slidingDoor", 
            label: translations.sliDoor, 
            // icon: <FileTextOutlined />, 
            onClick: () => handleSlidingDoorClick(record) 
          },
          { key: "wall_panels", label: translations.wallPanels },
        ],
      },
      { 
        key: "delete", 
        label: (
          <Popconfirm
            title={translations.sureToDelOrder}
            description={translations.sureToDelInfo}
            onConfirm={() => handleDeleteOrder(record.documentId)}
            okText={translations.yes}
            cancelText={translations.no}
            okButtonProps={{ danger: true }}
          >
            <span>
              <DeleteOutlined /> {translations.delete}
            </span>
          </Popconfirm>
        ),
        danger: true
      }
    ],
  });

  const expandedRowRender = (record) => {
    if (!record.suborders || record.suborders.length === 0) {
      return <p> {translations.noSuborders} </p>;
    }

    const suborderColumns = [
      { 
        title: '№', 
        key: 'subIndex', 
        width: 60,
        render: (_, __, index) => index + 1 
      },
      { 
        title: translations.suborderType, 
        dataIndex: 'suborder_type', 
        key: 'typeName',
        render: (suborder_type) => suborder_type?.typeName || '-'
      },
      { 
        title: translations.products, 
        dataIndex: 'suborder_products', 
        key: 'products',
        render: (suborder_products) => {
          if (!suborder_products || suborder_products.length === 0) return '-';
          return suborder_products.map(item => item.product?.title).join(', ');
        }
      },
      {
        title: translations.action,
        key: 'action',
        render: (_, suborder) => (
          <Space size="middle">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditSuborder(suborder.documentId, record.documentId)}
            >
              {translations.update}
            </Button>
            <Button 
              icon={<CopyOutlined />} 
              size="small"
              onClick={() => handleCloneSuborder(suborder.documentId)}
            >
              {translations.clone}
            </Button>
            <Popconfirm
              title={translations.sureToDelSubOrder}
              onConfirm={() => handleDeleteSuborder(suborder.documentId)}
              okText={translations.yes}
              cancelText={translations.no}
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
                loading={deletingSuborder}
              >
                {translations.delete}
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
    { title: translations.orderNumber, dataIndex: "orderNumber", key: "orderNumber", fixed: "left" },
    { title: translations.priceNetto, dataIndex: "totalCostNetto", key: "totalCostNetto" },
    { title: translations.priceBrutto, dataIndex: "totalCostBrutto", key: "totalCostBrutto" },
    { title: translations.tax, dataIndex: "taxRate", key: "taxRate" },
    { title: translations.deliveryCost, dataIndex: "deliveryCost", key: "deliveryCost" },
    { title: translations.discount, dataIndex: "clientDiscount", key: "clientDiscount" },
    { title: translations.extraCharge, dataIndex: "clientExtraPay", key: "clientExtraPay" },
    { 
      title: translations.agent, 
      dataIndex: "agent", 
      key: "agent",
      render: (agent) => agent?.name || "-"
    },
    { 
      title: translations.client, 
      dataIndex: "client", 
      key: "client",
      render: (client) => client?.name || "-"
    },
    {
      title: translations.comment,
      dataIndex: "comment",
      key: "comment",
      render: (text) =>
        text ? (
          <Button type="link" icon={<FileTextOutlined style={{ fontSize: "20px" }} />} onClick={() => setCommentModal({ open: true, text })} />
        ) : null,
    },
    {
      title: translations.ation,
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
        {translations.update}
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