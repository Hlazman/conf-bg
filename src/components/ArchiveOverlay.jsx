import React from 'react';

const ArchiveOverlay = ({ text = "Not available" }) => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 1,
    borderRadius: '5px',
  }}>
    <span style={{
      color: '#fff',
      fontSize: 18,
      transform: 'rotate(-20deg)',
      fontWeight: 'bold',
      opacity: 0.8
    }}>
      {text}
    </span>
  </div>
);

export default ArchiveOverlay;
