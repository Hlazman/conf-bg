import React, { useContext, useState } from "react";
import { Descriptions, Divider, Modal, Input, message, Button } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { calculateOrderPriceBySuborder } from "../api/calculateOrderPriceBySuborder";
import { EditOutlined } from "@ant-design/icons";
import { gql, useMutation, useApolloClient } from "@apollo/client";

const UPDATE_CUSTOM_COST = gql`
  mutation UpdateCustomProductCost($documentId: ID!, $customProductCostNetto: Float!) {
    updateSuborderProduct(documentId: $documentId, data: { customProductCostNetto: $customProductCostNetto }) {
      documentId
      customProductCostNetto
    }
  }
`;

const DoorFactory = ({ suborder, isPdf }) => {
  const [updateCustomCost] = useMutation(UPDATE_CUSTOM_COST);
  const client = useApolloClient();
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputCost, setInputCost] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Находим продукт с типом door, hiddenDoor или slidingDoor
  const doorProduct = suborder.suborder_products.find(product => 
    ['door', 'hiddenDoor', 'slidingDoor'].includes(product.type)
  );
  
  if (!doorProduct) return null;

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  const sizes = doorProduct.sizes || {};

  const openCostModal = (productId) => {
    setEditingProductId(productId);
    setModalVisible(true);
    setInputCost(""); // можно предзаполнять, если есть старое значение
  };

  const handleSaveCost = async () => {
    const value = Number(inputCost);
    if (!value || value < 1) {
      message.error(translations.enterPrice);
      return;
    }
    setUpdating(true);
    try {
      await updateCustomCost({
        variables: { documentId: editingProductId, customProductCostNetto: value }
      });
      await calculateOrderPriceBySuborder(client, suborder.documentId);
      setModalVisible(false);
      message.success(translations.save);
    } catch (e) {
      message.error(translations.err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="door-presentation">
      <Divider style={{ borderColor: '#fdf5e6' }} orientation="center">{translations[suborder.suborder_type.typeName]}</Divider>
        {suborder?.amount >= 1 && (
          <p> {translations.amount}: {suborder.amount} </p>
        )}

        <Descriptions 
          bordered 
          column={1} 
          size="small"
          style={{ width: '100%' }}
          styles={{ 
            label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
            content: { width: '50%' } 
          }}
        >
          <Descriptions.Item style={{fontWeight: '700'}} label={doorProduct.product?.title}>
            {/* <div style={{textAlign: 'right'}}> {formatPrice(doorProduct.productCostBasic)} </div> */}

            <div style={{
              textAlign: 'right',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}>
              {formatPrice(doorProduct.productCostBasic)}
              {(doorProduct.productCostBasic === 0 && !isPdf) && (
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  style={{ marginLeft: 8, padding: 0, height: 20 }}
                  onClick={() => openCostModal(doorProduct.documentId)}
                  size="small"
                  title={translations.price}
                />
              )}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label={translations.collection}>
            {doorProduct.product?.collections?.[0]?.title || '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label={translations.type}>
            {doorProduct.type === 'door' ? translations.inDoor : 
              doorProduct.type === 'hiddenDoor' ? translations.hiDoor : 
              doorProduct.type === 'slidingDoor' ? translations.sliDoor : '-'}
          </Descriptions.Item>

          {/* <Descriptions.Item label={translations.amount}>
            {doorProduct?.amount}
            
          </Descriptions.Item> */}

          <Descriptions.Item label={translations.doubleDoor}>
            {suborder.double_door ? translations.yes : translations.no}
          </Descriptions.Item>
          
          <Descriptions.Item label={translations.doorOpening}>
            {translations[suborder.opening] || '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label={translations.doorSide}>
            {translations[suborder.side] || '-'}
          </Descriptions.Item>

          <Descriptions.Item label={`${translations.height} (${translations.doorCanvas} / ${translations.block} / ${translations.holeWall})`}>
            {sizes.height ? `${sizes.height} mm` : '-'} {"/ "}
            {sizes.blockHeight ? `${sizes.blockHeight} mm` : '-'} {"/ "}
            {sizes.holeHeight ? `${sizes.holeHeight} mm` : '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label={`${translations.width} (${translations.doorCanvas} / ${translations.block} / ${translations.holeWall})` }>
            {sizes.width ? `${sizes.width} mm` : '-'} {"/ "}
            {sizes.blockWidth ? `${sizes.blockWidth} mm` : '-'} {"/ "}
            {sizes.holeWidth ? `${sizes.holeWidth} mm` : '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label={translations.thickness}>
            {sizes.thickness ? `${sizes.thickness} mm` : '-'}
          </Descriptions.Item>

          <Descriptions.Item label={translations.handleInsert}>
              {suborder.suborder_products[0].knobInsertion ? translations.yes : translations.no}
          </Descriptions.Item>
          
          <Descriptions.Item label={translations.mortiseLock}>
              {suborder.suborder_products[0].lockInsertion ? translations.yes : translations.no}
          </Descriptions.Item>
          
          <Descriptions.Item label={translations.lbInsert}>
              {suborder.suborder_products[0].spindleInsertion ? translations.yes : translations.no}
          </Descriptions.Item>
          
          <Descriptions.Item label={translations.thresholdInsert}>
              {suborder.suborder_products[0].thresholdInsertion ? translations.yes : translations.no}
          </Descriptions.Item>
          
          <Descriptions.Item label={translations.doorSeal}>
              {suborder.suborder_products[0].doorSeal ? translations[suborder.suborder_products[0].doorSeal] : '-'}
          </Descriptions.Item>

        </Descriptions>

        <Modal
          open={modalVisible && !isPdf}
          onCancel={() => setModalVisible(false)}
          onOk={handleSaveCost}
          confirmLoading={updating}
          okText={translations.save}
          cancelText={translations.cancel}
          title={translations.enterPrice}
        >
          <Input
            type="number"
            min={1}
            value={inputCost}
            onChange={e => setInputCost(e.target.value.replace(/^0+/, ""))}
            onPressEnter={handleSaveCost}
            disabled={updating}
            autoFocus
          />
        </Modal>
    </div>
  );
};

export default DoorFactory;
