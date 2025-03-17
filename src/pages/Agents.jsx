import React, { useState, useEffect, useContext } from "react";
import { Table, Button, Dropdown, Space, Popconfirm, message } from "antd";
import { 
  MenuOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { gql, useQuery, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

export const GET_AGENTS = gql`
  query GetAgents($filters: AgentFiltersInput, $pagination: PaginationArg) {
    agents(filters: $filters, pagination: $pagination) {
      documentId
      name
      email
      phone
      agentFee
    }
  }
`;

const DELETE_AGENT = gql`
  mutation DeleteAgent($documentId: ID!) {
    deleteAgent(documentId: $documentId) {
      documentId
    }
  }
`;

const Agents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany"));
  const { translations } = useContext(LanguageContext);
  
  const { data, loading, refetch } = useQuery(GET_AGENTS, {
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
      }
    },
    skip: !selectedCompany?.documentId,
  });

  // Обновляем данные при возвращении на страницу
  useEffect(() => {
    refetch();
  }, [location.pathname, refetch]);

  const [deleteAgent, { loading: deletingAgent }] = useMutation(DELETE_AGENT, {
    refetchQueries: [
      {
        query: GET_AGENTS,
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
          }
        }
      }
    ]
  });

  const agents = React.useMemo(() => {
    if (!data?.agents) return [];
    return [...data.agents];
  }, [data]);

  const handleEdit = (record) => {
    navigate(`/edit-agent/${record.documentId}`);
  };

  const handleDeleteAgent = async (agentId) => {
    try {
      await deleteAgent({
        variables: {
          documentId: agentId
        }
      });
      message.success(translations.agentCreated);
    } catch (error) {
      message.error(translations.errRemAgent);
      console.error("Error deleting agent:", error);
    }
  };

  const menu = (record) => ({
    items: [
      {
        key: "edit",
        label: translations.edit,
        icon: <EditOutlined />,
        onClick: () => handleEdit(record)
      },
      {
        key: "delete",
        label: translations.delete,
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteAgent(record.documentId)
      }
    ]
  });

  const columns = [
    {
      title: translations.name,
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: translations.phone,
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: `${translations.agentFee} %`,
      dataIndex: "agentFee",
      key: "agentFee",
      render: (agentFee) => `${agentFee || 0} %`,
    },
    {
      title: translations.action,
      key: "action",
      width: 100,
      render: (_, record) => (
        <Dropdown menu={menu(record)} trigger={["click"]}>
          <Button type="text" icon={<MenuOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>{translations.agents}</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/create-agent")}
        >
          {translations.createAgent}
        </Button>
      </div>
      <Table
        dataSource={agents}
        columns={columns}
        rowKey="documentId"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: translations.noAgents }}
      />
    </div>
  );
};

export default Agents;
