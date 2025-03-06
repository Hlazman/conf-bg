import React, { useEffect, useState } from "react";
import { Table, Dropdown, Button, Modal } from "antd";
import { MenuOutlined, EyeOutlined, EditOutlined, PlusOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

export const GET_ORDERS = gql`
  query GetOrders($filters: OrderFiltersInput) {
    orders(filters: $filters) {
      documentId
      number
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
    }
  }
`;

const Orders = () => {
  const [commentModal, setCommentModal] = useState({ open: false, text: "" });
  const navigate = useNavigate();
  const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany"));
  
  const { data, loading } = useQuery(GET_ORDERS, {
    variables: { 
      filters: { 
        company: { 
          documentId: { 
            eqi: selectedCompany?.documentId 
          } 
        } 
      } 
    },
    skip: !selectedCompany?.documentId,
  });

  const orders = React.useMemo(() => {
    if (!data?.orders) return [];
    return [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data]);

  const handleEdit = (record) => {
    navigate(`/edit-order/${record.documentId}`);
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
          { key: "hidden", label: "Скрытые двери" },
          { key: "interior", label: "Межкомнатные двери" },
          { key: "wall_panels", label: "Настенные панели" },
        ],
      },
      { key: "delete", label: "Удалить", icon: <DeleteOutlined /> },
    ],
  });

  const columns = [
    { title: "№ Order", dataIndex: "number", key: "number", fixed: "left" },
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
          <Button>
            <MenuOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <Table dataSource={orders} columns={columns} loading={loading} rowKey="documentId" scroll={{ x: 1300 }} />
      <Modal open={commentModal.open} footer={null} onCancel={() => setCommentModal({ open: false, text: "" })}>
        <p>{commentModal.text}</p>
      </Modal>
    </>
  );
};

export default Orders;

