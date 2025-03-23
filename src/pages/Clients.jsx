import React, { useEffect, useContext } from "react";
import { Table, Button, Dropdown, message } from "antd";
import { 
  MenuOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { gql, useQuery, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

export const GET_CLIENTS = gql`
  query GetClients($filters: ClientFiltersInput, $pagination: PaginationArg) {
    clients(filters: $filters, pagination: $pagination) {
      documentId
      name
      email
      phone
      address
      discount
    }
  }
`;

const DELETE_CLIENT = gql`
  mutation DeleteClient($documentId: ID!) {
    deleteClient(documentId: $documentId) {
      documentId
    }
  }
`;

const Clients = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany"));
  const { translations } = useContext(LanguageContext);
  
  const { data, loading, refetch } = useQuery(GET_CLIENTS, {
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

  const [deleteClient, { loading: deletingClient }] = useMutation(DELETE_CLIENT, { // eslint-disable-line no-unused-vars
    refetchQueries: [
      {
        query: GET_CLIENTS,
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

  const clients = React.useMemo(() => {
    if (!data?.clients) return [];
    return [...data.clients];
  }, [data]);

  const handleEdit = (record) => {
    console.log('record', record)
    navigate(`/edit-client/${record.documentId}`);
  };

  const handleDeleteClient = async (clientId) => {
    try {
      await deleteClient({
        variables: {
          documentId: clientId
        }
      });
      message.success(translations.clientCreated);
    } catch (error) {
      message.error(translations.errRemClient);
      console.error("Error deleting client:", error);
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
        onClick: () => handleDeleteClient(record.documentId)
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
      title: translations.address,
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: `${translations.discount} %`,
      dataIndex: "discount",
      key: "discount",
      render: (discount) => `${discount || 0} %`,
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
        <h2>{translations.clients}</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/create-client")}
        >
          {translations.createClient}
        </Button>
      </div>
      <Table
        dataSource={clients}
        columns={columns}
        rowKey="documentId"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: translations.noClients }}
      />
    </div>
  );
};

export default Clients;
