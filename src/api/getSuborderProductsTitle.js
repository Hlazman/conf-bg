import { gql } from '@apollo/client';

// GraphQL запрос для получения данных субордера
export const SUBORDER_QUERY = gql`
query Suborder($documentId: ID!) {
  suborder(documentId: $documentId) {
    documentId
    comment
    side
    opening
    suborder_products {
      documentId
      decor_type {
        documentId
        typeName
      }
      product {
        documentId
        title
      }
      sizes {
        height
        length
        thickness
        width
      }
      secondSideDecorType {
        documentId
        typeName
      }
      customTitle
      type
    }
  }
}
`;

// Функция для получения данных субордера и форматирования заголовков
export const fetchSuborderData = async (client, suborderId) => {
  try {
    const { data } = await client.query({
      query: SUBORDER_QUERY,
      variables: { documentId: suborderId },
      fetchPolicy: 'network-only'
    });
    
    if (!data || !data.suborder) {
      return null;
    }
    
    const suborder = data.suborder;
    const products = suborder.suborder_products || [];
    
    // Объект с форматированными заголовками
    const formattedTitles = {
      startData: formatStartData(suborder),
      doorSelection: formatDoorSelection(products),
      doorParameters: formatDoorParameters(products),
      frontDecorSelection: formatFrontDecorSelection(products),
      backDecorSelection: formatBackDecorSelection(products),
      slidingSelection: formatProductTitle(products, 'slidingFrame'),
      frameSelection: formatProductTitle(products, 'frame'),
      extenderSelection: formatProductTitle(products, 'extender'),
      platbandSelection: formatProductTitle(products, 'platband'),
      platbandThreadSelection: formatProductTitle(products, 'platbandThread'),
      platbandFrontSelection: formatProductTitle(products, 'platbandFront'),
      platbandBackSelection: formatProductTitle(products, 'platbandBack'),
      aluminumMoldingSelection: formatProductTitle(products, 'aluminumMolding'),
      aluminumFrameSelection: formatProductTitle(products, 'aluminumFrame'),
      aluminumCladdingSelection: formatProductTitle(products, 'aluminumCladding'),
      kapitelSelection: formatProductTitle(products, 'kapitel'),
      hingeSelection: formatProductTitle(products, 'hinge'),
      lockSelection: formatProductTitle(products, 'lock'),
      knobSelection: formatKnobTitle(products),
      optionSelection: formatOptionCount(products, 'option'),
      customOptionSelection: formatOptionCount(products, 'customOption'),
      commentSelection: formatComment(suborder)
    };
    
    return formattedTitles;
  } catch (error) {
    console.error('Error fetching suborder data:', error);
    return null;
  }
};

// Вспомогательные функции для форматирования заголовков

// Форматирование данных для StartData
const formatStartData = (suborder) => {
  if (!suborder.side && !suborder.opening) return null;
  
  const parts = [];
  if (suborder.side) parts.push(suborder.side);
  if (suborder.opening) parts.push(suborder.opening);
  
  return parts.join(', ');
};

// Форматирование данных для DoorSelection
const formatDoorSelection = (products) => {
  const doorProduct = products.find(p => 
    p.type === 'door' || p.type === 'slidingDoor' || p.type === 'hiddenDoor'
  );
  
  return doorProduct?.product?.title || null;
};

// Форматирование данных для DoorParameters
const formatDoorParameters = (products) => {
  const doorProduct = products.find(p => 
    p.type === 'door' || p.type === 'slidingDoor' || p.type === 'hiddenDoor'
  );
  
  if (!doorProduct || !doorProduct.sizes) return null;
  
  const sizes = doorProduct.sizes;
  const parts = [];
  
  if (sizes.height) parts.push(`Высота: ${sizes.height}`);
  if (sizes.width) parts.push(`Ширина: ${sizes.width}`);
  if (sizes.thickness) parts.push(`Толщина: ${sizes.thickness}`);
  
  return parts.join(', ');
};

// Форматирование данных для лицевого декора
const formatFrontDecorSelection = (products) => {
  const doorProduct = products.find(p => 
    p.type === 'door' || p.type === 'slidingDoor' || p.type === 'hiddenDoor'
  );
  
  return doorProduct?.decor_type?.typeName || null;
};

// Форматирование данных для тыльного декора
const formatBackDecorSelection = (products) => {
  const doorProduct = products.find(p => 
    p.type === 'door' || p.type === 'slidingDoor' || p.type === 'hiddenDoor'
  );
  
  return doorProduct?.secondSideDecorType?.typeName || null;
};

// Форматирование заголовка для продукта по типу
const formatProductTitle = (products, type) => {
  const product = products.find(p => p.type === type);
  return product?.product?.title || null;
};

// Форматирование заголовка для ручки
const formatKnobTitle = (products) => {
  const knobProduct = products.find(p => p.type === 'knob');
  return knobProduct?.customTitle || null;
};

// Форматирование количества для опций
const formatOptionCount = (products, type) => {
  const count = products.filter(p => p.type === type).length;
  return count > 0 ? `${count} шт.` : null;
};

// Форматирование комментария
const formatComment = (suborder) => {
  if (!suborder.comment) return null;
  
  const words = suborder.comment.split(' ');
  if (words.length > 0) {
    return words[0] + (words.length > 1 ? '...' : '');
  }
  
  return null;
};
