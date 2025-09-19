import React from "react";
import PropTypes from "prop-types";

/**
 * Generic Modal component.
 *
 * Props:
 * - isOpen: boolean to control visibility
 * - onClose: function to close the modal
 * - title: optional string title
 * - children: modal content
 * - backdropClass: optional class for backdrop to match existing styles
 * - modalClass: optional class for modal container to match existing styles
 * - showClose: show close (×) button in the corner, default true
 * - containerStyle: optional style object for modal container
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  backdropClass,
  modalClass,
  showClose = true,
  containerStyle,
}) => {
  if (!isOpen) return null;
  const backdropCls = backdropClass || "modal-backdrop";
  const modalCls = modalClass || "modal-container";

  return (
    <div className={backdropCls}>
      <div className={modalCls} style={containerStyle}>
        {/* Decorative top stripe */}
        <div className="modal-top-stripe" aria-hidden="true" />
        {showClose && (
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            title="إغلاق"
          >
            ×
          </button>
        )}
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  backdropClass: PropTypes.string,
  modalClass: PropTypes.string,
  showClose: PropTypes.bool,
  containerStyle: PropTypes.object,
};

export default Modal;
