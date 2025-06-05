import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { RiCheckboxCircleFill, RiErrorWarningFill, RiInformationFill, RiCloseLine } from 'react-icons/ri';

// Custom toast styles with MyTaxy theme
const toastStyles = {
    success: {
        style: {
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid #22c55e',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '320px',
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease-out forwards',
        },
        icon: <RiCheckboxCircleFill className="text-green-500 text-xl flex-shrink-0" />
    },
    error: {
        style: {
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid #ef4444',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '320px',
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease-out forwards',
        },
        icon: <RiErrorWarningFill className="text-red-500 text-xl flex-shrink-0" />
    },
    info: {
        style: {
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid #fdc700',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(253, 199, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '320px',
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease-out forwards',
        },
        icon: <RiInformationFill className="text-[#fdc700] text-xl flex-shrink-0" />
    }
};

// Add keyframes for slide-in animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(styleSheet);

// Simple toast component
const SimpleToast = ({ message, type, onClose }) => {
    const style = toastStyles[type];
    return (
        <div style={style.style} className="group">
            {style.icon}
            <div className="flex-1">
                <p className="font-medium">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-black/5 rounded-full"
            >
                <RiCloseLine className="text-gray-500" />
            </button>
        </div>
    );
};

// Custom toast component
const CustomToast = ({ children }) => {
    return (
        <Toaster
            position="top-center"
            containerStyle={{
                top: '80px', // Position below navbar
                left: '50%',
                transform: 'translateX(-50%)',
            }}
            toastOptions={{
                duration: 3000,
                style: {
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                },
                success: {
                    ...toastStyles.success,
                    duration: 3000,
                    className: 'toast-success',
                },
                error: {
                    ...toastStyles.error,
                    duration: 3000,
                    className: 'toast-error',
                },
                custom: {
                    ...toastStyles.info,
                    duration: 3000,
                    className: 'toast-info',
                }
            }}
        >
            {children}
        </Toaster>
    );
};

// Custom toast functions
export const showToast = {
    success: (message) => {
        toast.custom(
            (t) => (
                <SimpleToast
                    message={message}
                    type="success"
                    onClose={() => toast.dismiss(t.id)}
                />
            ),
            {
                ...toastStyles.success,
                duration: 3000,
            }
        );
    },
    error: (message) => {
        toast.custom(
            (t) => (
                <SimpleToast
                    message={message}
                    type="error"
                    onClose={() => toast.dismiss(t.id)}
                />
            ),
            {
                ...toastStyles.error,
                duration: 3000,
            }
        );
    },
    info: (message) => {
        toast.custom(
            (t) => (
                <SimpleToast
                    message={message}
                    type="info"
                    onClose={() => toast.dismiss(t.id)}
                />
            ),
            {
                ...toastStyles.info,
                duration: 3000,
            }
        );
    }
};

export default CustomToast; 