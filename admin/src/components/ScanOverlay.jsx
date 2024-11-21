import PropTypes from "prop-types"

export default function ScanOverlay({ color = '#6366F1' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        top: 0,
        left: 0,
        zIndex: 1,
        boxSizing: 'border-box',
        border: '50px solid transparent',
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
    >
      <path
        fill="none"
        d="M13,0 L0,0 L0,13"
        stroke={color}
        strokeWidth="5"
      ></path>
      <path
        fill="none"
        d="M0,87 L0,100 L13,100"
        stroke={color}
        strokeWidth="5"
      ></path>
      <path
        fill="none"
        d="M87,100 L100,100 L100,87"
        stroke={color}
        strokeWidth="5"
      ></path>
      <path
        fill="none"
        d="M100,13 L100,0 87,0"
        stroke={color}
        strokeWidth="5"
      ></path>
    </svg>
  )
}

ScanOverlay.propTypes = {
  color: PropTypes.string,
}