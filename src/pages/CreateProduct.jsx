import React, { useState, useEffect, useContext } from "react";
import { Typography, Collapse} from "antd";
import { useApolloClient } from "@apollo/client";
import DoorSelection from '../components/DoorSelection';
import DecorSelection from '../components/DecorSelection';
import DoorParameters from '../components/DoorParameters';
import FrameSelection from '../components/FrameSelection';
import StartData from '../components/StartData';
import SlidingSelection from '../components/SlidingSelection';
import ElementSelection from '../components/ElementSelection';
import HingeSelection from '../components/HingeSelection';
import LockSelection from "../components/LockSelection";
import KnobSelection from "../components/KnobSelection";
import OptionSelection from "../components/OptionSelection";
import CustomOptionSelection from "../components/CustomOptionSelection";
import CommentSelection from "../components/CommentSelection";
import ErrorAlerts from "../components/ErrorAlerts";
import { fetchSuborderData } from "../api/getSuborderProductsTitle";
import { LanguageContext } from "../context/LanguageContext";
import { validateSuborderProducts } from "../api/validateSuborderErrors";
import { calculateOrderPriceBySuborder } from '../api/calculateOrderPriceBySuborder';

const { Title } = Typography;

const CreateProduct = () => {
  const client = useApolloClient();
  const { translations } = useContext(LanguageContext);
  const suborderId = localStorage.getItem('currentSuborderId');
  const type = localStorage.getItem('currentType');
  const doorType = localStorage.getItem('currentType');

  // Состояние для выбранной двери
  const [selectedDoor, setSelectedDoor] = useState(null);  
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");  
  const [selectedBackDecorType, setSelectedBackDecorType] = useState(null);
  const [selectedBackDecor, setSelectedBackDecor] = useState(null);
  const [backColorCode, setBackColorCode] = useState("");  
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [selectedHinge, setSelectedHinge] = useState(null);
  const [selectedLock, setSelectedLock] = useState(null);
  const [selectedKnob, setSelectedKnob] = useState(null);
  const [activeKeys, setActiveKeys] = useState(['1', '2']);
  const [formattedTitles, setFormattedTitles] = useState({});
  
  
  const handleDoorSelect = (door) => {
    setSelectedDoor(door);
  };

  const handleFrameSelect = (frame) => {
    setSelectedFrame(frame);
  };

  const handleHingeSelect = (hinge) => {
    setSelectedHinge(hinge);
  };

  const handleLockSelect = (lock) => {
    setSelectedLock(lock);
  };

  const handleKnobSelect = (knob) => {
  setSelectedKnob(knob);
  };
      
  const onCollapseChange = (keys) => {
    setActiveKeys(keys);
  };
  
  const clearBackSelection = () => {
    setSelectedBackDecorType(null);
    setSelectedBackDecor(null);
    setBackColorCode("");
  };

useEffect(() => {
  if (suborderId) {
    fetchSuborderData(client, suborderId)
      .then(titles => {
        if (titles) {
          setFormattedTitles(titles);
        }
      });
  }
}, [suborderId, client]);


const [suborderErrors, setSuborderErrors] = useState({});
const handleErrorsUpdate = (errors) => {
  setSuborderErrors(errors);
};

const formatItemLabel = (baseLabel, additionalInfo, errorKey) => {
  if (!additionalInfo) return baseLabel;
  
  const hasError = errorKey && suborderErrors && suborderErrors[errorKey] === true;  
  const color = hasError ? '#FF0000' : '#00A651';
  
  return (
    <span style={{ color, fontWeight: 'bold' }}>
      {baseLabel} : {additionalInfo}
    </span>
  );
};

const updateFormattedTitles = async () => {
  if (suborderId) {
    const titles = await fetchSuborderData(client, suborderId);
    if (titles) {
      setFormattedTitles(titles);
    }
    await validateSuborderProducts(client, suborderId);
    await calculateOrderPriceBySuborder(client, suborderId);
  }
};
 
const items = [
  {
    key: '1',
    label: formatItemLabel(translations.startData, formattedTitles.startData),
    children: <StartData 
      suborderId={suborderId}
      onAfterSubmit={updateFormattedTitles} 
    />
  },
  {
    key: '2',
    label: formatItemLabel(translations.doorCanvas, formattedTitles.doorSelection),
    children: 
      <DoorSelection 
        selectedDoor={selectedDoor} 
        onDoorSelect={handleDoorSelect} 
        suborderId={suborderId}
        onAfterSubmit={updateFormattedTitles}
        // setSentDoor={setSentDoor}
    />
  },
  {
    key: '3',
    label: 
      type === 'slidingDoor' 
          ? formatItemLabel(translations.slidingFrame, formattedTitles.slidingSelection) 
          : formatItemLabel(translations.frame, formattedTitles.frameSelection, 'frameError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: type === 'slidingDoor' ? (
      <SlidingSelection 
        suborderId={suborderId}
        onAfterSubmit={updateFormattedTitles} 
      />
    ) : (
      <FrameSelection
        doorId={selectedDoor?.documentId}
        collectionId={selectedDoor?.collections?.[0]?.documentId}
        selectedFrame={selectedFrame}
        onFrameSelect={handleFrameSelect}
        suborderId={suborderId}
        onAfterSubmit={updateFormattedTitles} 
      />
    )
  },
  {
    key: '4',
    label: formatItemLabel(translations.doorParameters, formattedTitles.doorParameters, 'doorParamsError'),
    children: (
      <DoorParameters 
        selectedDoor={selectedDoor} 
        suborderId={suborderId}
        onAfterSubmit={updateFormattedTitles} 
      />
    )
  },
  {
    key: '5',
    label: formatItemLabel(translations.decorFront, formattedTitles.frontDecorSelection, 'decorError'),
    children: (
      <DecorSelection 
        doorId={selectedDoor?.documentId}
        selectedDecorType={selectedFrontDecorType}
        selectedDecor={selectedFrontDecor}
        colorCode={frontColorCode}
        onDecorTypeSelect={setSelectedFrontDecorType}
        onDecorSelect={setSelectedFrontDecor}
        onColorChange={setFrontColorCode}
        isFrontSide={true}
        suborderId={suborderId}
        productType={doorType}
        onAfterSubmit={updateFormattedTitles}
      />
    )
  },
  {
    key: '6',
    label: formatItemLabel(translations.decorBack, formattedTitles.backDecorSelection, 'decorError'),
    children: (
      <DecorSelection 
        doorId={selectedDoor?.documentId}
        selectedDecorType={selectedBackDecorType}
        selectedDecor={selectedBackDecor}
        colorCode={backColorCode}
        onDecorTypeSelect={setSelectedBackDecorType}
        onDecorSelect={setSelectedBackDecor}
        onColorChange={setBackColorCode}
        isFrontSide={false}
        onClearSelection={clearBackSelection}
        suborderId={suborderId}
        productType={doorType}
        onAfterSubmit={updateFormattedTitles}
      />
    )
  },
  {
    key: '7',
    label: formatItemLabel(translations.extender, formattedTitles.extenderSelection, 'extenderError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="extender"
        availableSizes={{ width: true, height: false, length: false, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles}
        isBackDecorDisabled={true}
        selectedFrame={selectedFrame}
      />
    )
  },
  {
    key: '8',
    label: formatItemLabel(translations.platband, formattedTitles.platbandSelection, 'platbandError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="platband"
        availableSizes={{ width: true, height: false, length: false, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles}
        isBackDecorDisabled={false} 
      />
    )
  },
  {
    key: '9',
    label: formatItemLabel(translations.platbandThread, formattedTitles.platbandThreadSelection, 'platbandThreadError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="platbandThread"
        availableSizes={{ width: true, height: false, length: false, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles}
        isBackDecorDisabled={false} 
      />
    )
  },
  {
    key: '10',
    label: formatItemLabel(translations.platbandFront, formattedTitles.platbandFrontSelection, 'platbandFrontError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="platbandFront"
        availableSizes={{ width: true, height: false, length: false, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles}
        isBackDecorDisabled={true} 
      />
    )
  },
  {
    key: '11',
    label: formatItemLabel(translations.platbandBack, formattedTitles.platbandBackSelection, 'platbandBackError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="platbandBack"
        availableSizes={{ width: true, height: false, length: false, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles} 
        isBackDecorDisabled={true}
      />
    )
  },
  {
    key: '12',
    label: formatItemLabel(translations.kapitel, formattedTitles.kapitelSelection),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="kapitel"
        availableSizes={{ width: false, height: true, length: false, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles} 
        isBackDecorDisabled={true}
      />
    )
  },
  {
    key: '13',
    label: formatItemLabel(translations.aluminumMolding, formattedTitles.aluminumMoldingSelection, 'aluminumMoldingError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="aluminumMolding"
        availableSizes={{ width: false, height: false, length: true, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles} 
        isBackDecorDisabled={true}
      />
    )
  },
  {
    key: '14',
    label: formatItemLabel(translations.aluminumFrame, formattedTitles.aluminumFrameSelection, 'aluminumFrameError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="aluminumFrame"
        availableSizes={{ width: false, height: false, length: false, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles} 
        isBackDecorDisabled={true}
      />
    )
  },
  {
    key: '15',
    label: formatItemLabel(translations.aluminumCladding, formattedTitles.aluminumCladdingSelection, 'aluminumCladdingError'),
    collapsible: !selectedDoor ? "disabled" : undefined,
    children: (
      <ElementSelection
        selectedDoor={selectedDoor}
        suborderId={suborderId}
        productType="aluminumCladding"
        availableSizes={{ width: false, height: false, length: false, thickness: false }}
        defaultSizes={{ width: null, height: null, length: null, thickness: null }}
        onAfterSubmit={updateFormattedTitles} 
        isBackDecorDisabled={true}
      />
    )
  },
  ...(type !== 'slidingDoor' ? [
    {
      key: '16',
      label: formatItemLabel(translations.hinge, formattedTitles.hingeSelection, 'hingeError'),
      children: (
        <HingeSelection 
          suborderId={suborderId}
          collectionId={selectedDoor?.collections?.[0]?.documentId}
          selectedHinge={selectedHinge}
          onHingeSelect={handleHingeSelect}
          onAfterSubmit={updateFormattedTitles}
          doorId={selectedDoor?.documentId}
        />
      )
    },
    {
      key: '17',
      label: formatItemLabel(translations.lock, formattedTitles.lockSelection),
      children: (
        <LockSelection 
          suborderId={suborderId}
          selectedLock={selectedLock}
          onLockSelect={handleLockSelect}
          onAfterSubmit={updateFormattedTitles}
        />
      )
    }
  ] : []),
  {
    key: '18',
    label: formatItemLabel(translations.knob, formattedTitles.knobSelection),
    children: (
      <KnobSelection 
        suborderId={suborderId}
        collectionId={selectedDoor?.collections?.[0]?.documentId}
        selectedKnob={selectedKnob}
        onKnobSelect={handleKnobSelect}
        onAfterSubmit={updateFormattedTitles} 
      />
    )
  },
  {
    key: '19',
    label: formatItemLabel(translations.options, formattedTitles.optionSelection, 'optionError'),
    children: (
      <OptionSelection 
        suborderId={suborderId}
        selectedDoor={selectedDoor}
        onAfterSubmit={updateFormattedTitles} 
      />
    )
  },
  {
    key: '20',
    label: formatItemLabel(translations.customOption, formattedTitles.customOptionSelection),
    children: (
      <CustomOptionSelection 
        suborderId={suborderId}
        onAfterSubmit={updateFormattedTitles} 
      />
    )
  },
  {
    key: '21',
    label: formatItemLabel(translations.comment, formattedTitles.commentSelection),
    children: (
      <CommentSelection 
        suborderId={suborderId}
        onAfterSubmit={updateFormattedTitles}
      />
    )
  },
];
  
  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}> {translations.create} {translations.product} </Title>
      {/* <ErrorAlerts suborderId={suborderId} sentDoor={sentDoor}/> */}
      <ErrorAlerts suborderId={suborderId} onErrorsUpdate={handleErrorsUpdate}/>
      <Collapse 
        items={items}
        defaultActiveKey={activeKeys} 
        onChange={onCollapseChange}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};

export default CreateProduct;