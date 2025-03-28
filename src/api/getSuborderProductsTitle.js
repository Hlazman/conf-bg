import { gql } from '@apollo/client';

// GraphQL запрос для получения данных субордера
export const SUBORDER_QUERY = gql`
query Suborder($documentId: ID!, $pagination: PaginationArg) {
  suborder(documentId: $documentId) {
    documentId
    comment
    side
    opening
    suborder_products(pagination: $pagination) {
      documentId
      decor_type {
        documentId
        typeName
      }
      product {
        documentId
        title
        brand
        image {
          documentId
          url
        }
        collections {
          documentId
          title
        }
        type
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
        documentId
      }
      customTitle
      type
    }
  }
}
`;

// Функция для получения данных субордера и форматирования заголовков
export const fetchSuborderData = async (client, suborderId, limit = 100) => {
  try {
    const { data } = await client.query({
      query: SUBORDER_QUERY,
      variables: { documentId: suborderId, pagination: { limit: limit } },
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
      commentSelection: formatComment(suborder),
      wallPanelSelection: formatWallPanelSelection(products),
      skirtingSelection: formatProductTitle(products, 'skirting'),
      skirtingDecorSelection: formatSkirtingDecorSelection(products),
      sampleslSelection: formatSamplesSelection(products),
    };
    
    return formattedTitles;
  } catch (error) {
    // console.error('Error fetching suborder data:', error);
    return null;
  }
};
// Форматирование данных для StartData
const formatStartData = (suborder) => {
  if (!suborder.side && !suborder.opening) return null;
  
  const parts = [];
  if (suborder.side) parts.push(suborder.side);
  if (suborder.opening) parts.push(suborder.opening);
  
  return parts.join(', ');
};

// Форматирование данных для SampleSelection (до скобок)
const formatSamplesSelection = (products) => {
  const sampleProducts = products.filter(p => p.type === 'sample');
  
  if (sampleProducts.length === 0) return null;
  
  // Собираем заголовки всех образцов в массив
  const sampleTitles = sampleProducts
    .map(product => {
      // Получаем текст до скобок и удаляем лишние пробелы
      const title = product.product?.title || '';
      return title.split('(')[0].trim();
    })
    .filter(title => title); // Фильтруем пустые значения
  
  // Объединяем заголовки через запятую
  return sampleTitles.join(', ');
};

// Форматирование данных для WallPanelSelection по брендам
const formatWallPanelSelection = (products) => {
  const wallPanelProducts = products.filter(p => p.type === 'wallPanel');
  const brandTitles = {
    Danapris: null,
    CharmWood: null
  };
  
  wallPanelProducts.forEach(product => {
    if (product.product?.brand && product.product?.title) {
      brandTitles[product.product.brand] = product.product.title;
    }
  });
  
  return brandTitles;
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
  
  if (sizes.height) parts.push(`H: ${sizes.height}`);
  if (sizes.width) parts.push(`W: ${sizes.width}`);
  if (sizes.thickness) parts.push(`T: ${sizes.thickness}`);
  
  return parts.join(', ');
};

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

// Форматирование данных для декора плинтуса
const formatSkirtingDecorSelection = (products) => {
  const doorProduct = products.find(p => p.type === 'skirtingInsert');
  
  return doorProduct?.decor_type?.typeName || null;
};

// // Форматирование заголовка для продукта по типу
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
  return count > 0 ? `${count} szt.` : null;
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
