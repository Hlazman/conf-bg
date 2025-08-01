import React, { useState, useEffect, useContext } from "react";
import { Table, Dropdown, Button, Modal, message, Space, Popconfirm } from "antd";
import { 
  MenuOutlined, 
  EyeOutlined, 
  EditOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  FileTextOutlined,
  CopyOutlined,
  TruckOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { gql, useQuery, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import { useApolloClient } from "@apollo/client";
import { deleteSuborderWithProducts, deleteOrderWithSuborders } from "../api/deleteProducts";
import { cloneSuborderWithProducts } from "../api/cloneSuborder";
import { CurrencyContext } from "../context/CurrencyContext";
import { calculateOrderPriceBySuborder } from '../api/calculateOrderPriceBySuborder';

export const GET_ORDERS = gql`
  query GetOrders($filters: OrderFiltersInput, $pagination: PaginationArg, $suborderFilters: SuborderProductFiltersInput) {
    orders(filters: $filters, pagination: $pagination) {
      documentId
      metaData
      archive
      fixed
      remind
      orderNumber
      totalCostNetto
      totalCostBrutto
      taxRate
      deliveryCost
      installationCost
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
        amount
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

const UPDATE_SUBORDER_AMOUNT = gql`
  mutation UpdateSuborder($documentId: ID!, $amount: Int!) {
    updateSuborder(documentId: $documentId, data: { amount: $amount }) {
      documentId
      amount
    }
  }
`;

// Мутация для archive
const UPDATE_ORDER_ARCHIVE = gql`
  mutation UpdateOrderArchive($documentId: ID!, $archive: Boolean!) {
    updateOrder(documentId: $documentId, data: { archive: $archive }) {
      documentId
      archive
    }
  }
`;

// Мутация для fixed
const UPDATE_ORDER_FIXED = gql`
  mutation UpdateOrderFixed($documentId: ID!, $fixed: Boolean!) {
    updateOrder(documentId: $documentId, data: { fixed: $fixed }) {
      documentId
      fixed
    }
  }
`;

// Мутация для remind
const UPDATE_ORDER_REMIND = gql`
  mutation UpdateOrderRemind($documentId: ID!, $remind: Boolean!) {
    updateOrder(documentId: $documentId, data: { remind: $remind }) {
      documentId
      remind
    }
  }
`;

const Orders = () => {
  const [commentModal, setCommentModal] = useState({ open: false, text: "" });
  const [editAmountModal, setEditAmountModal] = useState({ open: false, suborderId: null, orderId: null, amount: "1" });
  const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany"));
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);
  const client = useApolloClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [showArchive, setShowArchive] = useState(false);
  const [archiveModal, setArchiveModal] = useState({ open: false, order: null, value: false });
  const [showFixedOnly, setShowFixedOnly] = useState(false);
  const [showRemindOnly, setShowRemindOnly] = useState(false);
  const [informationModalOpen, setinformationModalOpen] = useState(false);

  const [updateSuborder, { loading: updatingAmount }] = useMutation(UPDATE_SUBORDER_AMOUNT);
  
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
            in: ["door", "hiddenDoor", "samples", "slidingDoor", "wallPanel", "skirting"]
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
                in: ["door", "hiddenDoor", "samples", "slidingDoor", "wallPanel", "skirting"]
              }
            }
          }
        }
      }
    ]
  });

  // Обновляем archive заказа
  const [updateOrderArchive] = useMutation(UPDATE_ORDER_ARCHIVE, {
    onCompleted: () => refetch(),
    onError: (e) => message.error(e.message),
  });

  const [updateOrderFixed] = useMutation(UPDATE_ORDER_FIXED, { 
    onCompleted: refetch,
    onError: (e) => message.error(e.message),
  });

  const [updateOrderRemind] = useMutation(UPDATE_ORDER_REMIND, { 
    onCompleted: refetch,
    onError: (e) => message.error(e.message),
  });

  // All Orders
  const orders = React.useMemo(() => {
    if (!data?.orders) return [];
    return [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data]);

  // All filtered Orders
  // const filteredOrders = React.useMemo(() => {
  //   return orders.filter(order => !!order.archive === showArchive);
  // }, [orders, showArchive]);

  const filteredOrders = React.useMemo(() => {
    let result = orders.filter(order => !!order.archive === showArchive);
    if (showFixedOnly) result = result.filter(order => !!order.fixed);
    if (showRemindOnly) result = result.filter(order => !!order.remind);
    return result;
  }, [orders, showArchive, showFixedOnly, showRemindOnly]);

  const handleViewPresentation = (record) => {
    navigate(`/presentation/${record.documentId}/client`);
  };

  const handleViewShortPresentation = (record) => {
    navigate(`/presentation/${record.documentId}/short`);
  };
  
  const handleViewFactoryPresentation = (record) => {
    navigate(`/presentation/${record.documentId}/factory`);
  };

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
      navigate(`/create-product`);
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
      navigate(`/create-product`);
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
    localStorage.setItem('currentType', "slidingDoor");
    navigate(`/create-product`);
  } catch (error) {
    message.error(translations.errCreateSubOrder);
    console.error("Error creating suborder:", error);
  }
};

const handleWallPanelClick = async (record) => {
  try {
    const { data: suborderData } = await createSuborder({
      variables: {
        data: {
          hidden: false,
          order: record.documentId,
          suborder_type: 6 // ID для типа wallPanel
        }
      }
    });

    // Сохраняем ID субордера в localStorage
    localStorage.setItem('currentSuborderId', suborderData.createSuborder.documentId);
    navigate(`/create-wallpanel`);
  } catch (error) {
    message.error(translations.errCreateSubOrder);
    console.error("Error creating suborder:", error);
  }
};

const handleSkirtingClick = async (record) => {
  try {
    const { data: suborderData } = await createSuborder({
      variables: {
        data: {
          hidden: false,
          order: record.documentId,
          suborder_type: 13 // ID для типа skirting
        }
      }
    });

    // Сохраняем ID субордера в localStorage
    localStorage.setItem('currentSuborderId', suborderData.createSuborder.documentId);
    navigate(`/create-skirting`);
  } catch (error) {
    message.error(translations.errCreateSubOrder);
    console.error("Error creating suborder:", error);
  }
};

const handleSampleClick = async (record) => {
  try {
    const { data: suborderData } = await createSuborder({
      variables: {
        data: {
          hidden: false,
          order: record.documentId,
          suborder_type: 8 // ID для типа samples
        }
      }
    });

    // Сохраняем ID субордера в localStorage
    localStorage.setItem('currentSuborderId', suborderData.createSuborder.documentId);
    navigate(`/create-samples`);
  } catch (error) {
    message.error(translations.errCreateSubOrder);
    console.error("Error creating suborder:", error);
  }
};

  const handleEditSuborder = (suborderId, orderId) => {
    localStorage.setItem('currentSuborderId', suborderId);
    const order = orders.find(order => order.documentId === orderId);
    const suborder = order?.suborders?.find(sub => sub.documentId === suborderId);

    let currentType = "door"; 
    let navigationPath = "/create-product";
    
    if (suborder?.suborder_type) {
      const typeName = suborder.suborder_type.typeName;
      
      if (typeName.includes("hidden")) {
        currentType = "hiddenDoor";
      } else if (typeName.includes("slidingDoor")) {
        currentType = "slidingDoor";
      } else if (typeName.includes("wallPanel")) {
        currentType = "wallPanel";
        navigationPath = "/create-wallpanel";
      } else if (typeName.includes("samples")) {
        currentType = "samples";
        navigationPath = "/create-samples";
      } else if (typeName.includes("skirting")) {
        currentType = "skirting";
        navigationPath = "/create-skirting";
      } else {
        currentType = "door";
      }
    }
    
    // Сохраняем тип в localStorage, как это делается в других функциях
    localStorage.setItem('currentType', currentType);
    
    // Переходим на соответствующую страницу без передачи state
    navigate(navigationPath);
  };

  const handleCloneSuborder = async (suborderId) => {
    const newSuborderId = await cloneSuborderWithProducts(
      suborderId, 
      client, 
      message, 
      translations
    );
    
    if (newSuborderId) {
      refetch(); // Обновляем список заказов, чтобы отобразить новый подзаказ
    }
  };

  const handleDeleteSuborder = async (suborderId) => {
    const success = await deleteSuborderWithProducts(
      suborderId, 
      client, 
      message, 
      translations
    );
    
    if (success) {
      refetch();
    }
  };
   
  const handleDeleteOrder = async (orderId) => {
    const success = await deleteOrderWithSuborders(
      orderId, 
      orders, 
      client, 
      message, 
      translations
    );
    
    if (success) {
      refetch();
    }
  };

  const handleEditAmountClick = (suborder, orderId) => {
    setEditAmountModal({
      open: true,
      suborderId: suborder.documentId,
      orderId,
      amount: suborder.amount,
    });
  };

  const handleAmountChange = (e) => {
    // Просто берем строку, не парсим в число!
    setEditAmountModal((prev) => ({
      ...prev,
      amount: e.target.value.replace(/^0+/, "") // опционально убираем лидирующие нули
    }));
  };

  const handleSaveAmount = async () => {
    const amountNum = Number(editAmountModal.amount);
    if (!amountNum || amountNum < 1) {
      message.error(translations.errMinAmount);
      return;
    }
    try {
      await updateSuborder({
        variables: { documentId: editAmountModal.suborderId, amount: amountNum }
      });

      await calculateOrderPriceBySuborder(client, editAmountModal.suborderId);

      setEditAmountModal({ open: false, suborderId: null, orderId: null, amount: "1" });
      await refetch();
      message.success(translations.save);
    } catch (err) {
      message.error(translations.err);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveModal.order) return;
    try {
      await updateOrderArchive({
        variables: { documentId: archiveModal.order.documentId, archive: archiveModal.value }
      });
      setArchiveModal({ open: false, order: null, value: false });
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleArchiveCancel = () => {
    setArchiveModal({ open: false, order: null, value: false });
  };

  const handleFixedChange = (record, value) => {
    updateOrderFixed({ variables: { documentId: record.documentId, fixed: value } });
  };
  const handleRemindChange = (record, value) => {
    updateOrderRemind({ variables: { documentId: record.documentId, remind: value } });
  };

  const menu = (record) => ({
    items: [
      { key: "view", label: translations.view, icon: <EyeOutlined />, onClick: () => handleViewPresentation(record) },
      { key: "viewShort", label: translations.shortPresentation, icon: <EyeOutlined />, onClick: () => handleViewShortPresentation(record) },
      ...(selectedCompany?.documentId === 'ssl7a2m8avygknizy1ms496y' || 
        selectedCompany?.documentId === 'hcpjgh4exp1pxv3ozozzeqpt' 
      ? [{ 
          key: "viewFactory", 
          label: translations.factory, 
          icon: <TruckOutlined />,
          onClick: () => handleViewFactoryPresentation(record)
        }] 
      : []),
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
          { 
            key: "wall_panels", 
            label: translations.wallPanels,
            onClick: () => handleWallPanelClick(record) 
          },
          { 
            key: "skirting", 
            label: translations.skirting,
            onClick: () => handleSkirtingClick(record) 
          },
          { 
            key: "samples", 
            label: translations.samples,
            onClick: () => handleSampleClick(record) 
          },
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
        render: (suborder_type) => translations[suborder_type?.typeName] || '-'
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
        title: translations.amount,
        dataIndex: 'amount',
        key: 'amount',
        render: (amount, suborder) => (
          <Space>
            {amount}
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditAmountClick(suborder, record.documentId)}
            />
          </Space>
        )
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
    { title: translations.orderNumber, dataIndex: "orderNumber", key: "orderNumber", fixed: "left", width: '150px', },
    { title: translations.tax, dataIndex: "taxRate", key: "taxRate", width: '100px', },
    {
      title: translations.priceNetto,
      dataIndex: 'totalCostNetto',
      key: 'totalCostNetto',
      width: '150px',
      render: (totalCostNetto) => `${convertFromEUR(totalCostNetto)} ${getCurrencySymbol()}`
    },
    {
      title: translations.priceBrutto,
      dataIndex: 'totalCostBrutto',
      key: 'totalCostBrutto',
      width: '150px',
      render: (totalCostBrutto) => `${convertFromEUR(totalCostBrutto)} ${getCurrencySymbol()}`
    },
    {
      title: translations.deliveryCost,
      dataIndex: 'deliveryCost',
      key: 'deliveryCost',
      width: '150px',
      render: (deliveryCost) => `${convertFromEUR(deliveryCost)} ${getCurrencySymbol()}`
    },
    {
      title: translations.installation,
      dataIndex: 'installationCost',
      key: 'installationCost',
      width: '150px',
      render: (installationCost) => `${convertFromEUR(installationCost)} ${getCurrencySymbol()}`
    },
    { title: translations.discount, dataIndex: "clientDiscount", key: "clientDiscount", width: '150px', },
    { title: translations.extraCharge, dataIndex: "clientExtraPay", key: "clientExtraPay", width: '150px', },
    {
      title: translations.manager,
      dataIndex: "metaData",
      key: "manager",
      width: '150px',
      render: (metaData) => metaData?.selectedManagerName || "-",
    },
    { 
      title: translations.agent, 
      dataIndex: "agent", 
      key: "agent",
      width: '150px',
      render: (agent) => agent?.name || "-"
    },
    { 
      title: translations.client, 
      dataIndex: "client", 
      key: "client",
      width: '150px',
      render: (client) => client?.name || "-"
    },
    {
      title: translations.archive,
      dataIndex: "archive",
      key: "archive",
      width: '100px',
      render: (archive, record) => (
        <input
          type="checkbox"
          checked={!!archive}
          onChange={e => setArchiveModal({ open: true, order: record, value: e.target.checked })}
        />
      ),
    },
    {
      title: translations.fixed,
      dataIndex: "fixed",
      key: "fixed",
      width: '120px',
      render: (fixed, record) => (
        <input
          type="checkbox"
          checked={!!fixed}
          onChange={e => handleFixedChange(record, e.target.checked)}
        />
      ),
    },
    {
      title: translations.remind,
      dataIndex: "remind",
      key: "remind",
      width: '120px',
      render: (remind, record) => (
        <input
          type="checkbox"
          checked={!!remind}
          onChange={e => handleRemindChange(record, e.target.checked)}
        />
      ),
    },
    {
      title: translations.comment,
      dataIndex: "comment",
      key: "comment",
      width: '120px',
      render: (text) =>
        text ? (
          <Button type="link" icon={<FileTextOutlined style={{ fontSize: "20px" }} />} onClick={() => setCommentModal({ open: true, text })} />
        ) : null,
    },
    {
      title: translations.ation,
      key: "actions",
      fixed: "right",
      width: '100px',
      render: (record) => (
        <Dropdown menu={menu(record)} trigger={["click"]}>
          <Button loading={creatingSuborder}>
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
      <Button
        icon={<InfoCircleOutlined style={{ color: "#1890ff" }} />}
        onClick={() => setinformationModalOpen(true)}
        style={{ marginBottom: 16, marginRight: 8 }}
      >
        {translations.information}
      </Button>

      <Button onClick={() => refetch()} style={{ marginBottom: 16 }} disabled>
        {translations.update}
      </Button>

      <Button
        type={showArchive ? "primary" : "default"}
        danger={showArchive}
        onClick={() => setShowArchive(val => !val)}
        style={{
          marginBottom: 16,
          marginLeft: 8,
          backgroundColor: showArchive ? '#ffcccc' : undefined,
          color: showArchive ? '#a00' : undefined
        }}
      >
        {translations.archive}
      </Button>

      <Button
        type={showFixedOnly ? "primary" : "default"}
        onClick={() => setShowFixedOnly(val => !val)}
        style={{ marginBottom: 16, marginLeft: 8 }}
      >
        {translations.fixed }
      </Button>

      <Button
        type={showRemindOnly ? "primary" : "default"}
        onClick={() => setShowRemindOnly(val => !val)}
        style={{ marginBottom: 16, marginLeft: 8 }}
      >
        {translations.remind}
      </Button>

      <Table 
        // dataSource={orders}
        dataSource={filteredOrders}
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

      <Modal
        open={editAmountModal.open}
        title={translations.edit}
        onCancel={() => setEditAmountModal({ open: false, suborderId: null, orderId: null, amount: 1 })}
        onOk={handleSaveAmount}
        confirmLoading={updatingAmount}
        okText={translations.save}
        cancelText={translations.cancel}
      >
        <input
          type="number"
          min={1}
          value={editAmountModal.amount}
          onChange={handleAmountChange}
          style={{ width: '100%', fontSize: 16, padding: 6 }}
          inputMode="numeric"
        />
      </Modal>

      <Modal
        open={archiveModal.open}
        onOk={handleArchiveConfirm}
        onCancel={handleArchiveCancel}
        okText={translations.yes}
        cancelText={translations.no}
      >
        <p>
          {archiveModal.value
            ? translations.sureToArchiveOrder
            : translations.sureToUnarchiveOrder}
        </p>
      </Modal>

      <Modal
        open={informationModalOpen}
        onCancel={() => setinformationModalOpen(false)}
        footer={null}
        title={translations.information}
      >
        <div style={{marginBottom: '10px 0'}} > <span style={{fontWeight: 'bold'}}> {translations.update} </span>: {translations.btnUpdate} </div>
        <div style={{marginBottom: '10px 0'}} > <span style={{fontWeight: 'bold'}}> {translations.archive} </span>: {translations.btnArchive} </div>
        <div style={{marginBottom: '10px 0'}} > <span style={{fontWeight: 'bold'}}> {translations.fixed} </span>: {translations.btnFixed} </div>
        <div style={{marginBottom: '10px 0'}} > <span style={{fontWeight: 'bold'}}> {translations.remind} </span>: {translations.btnRemind} </div>
      </Modal>
    </>
  );
};

export default Orders;
