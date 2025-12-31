import { createPortal } from "react-dom";

const SimpleModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-md z-50">
      <div className="bg-base-100 p-6 rounded-lg shadow-xl w-full max-w-md relative text-white">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl"
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
};

export default SimpleModal;