import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { UserDataContext } from '../context/UserContext';
import { showToast } from './CustomToast';
import { FaDownload, FaPrint, FaTimes } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getToken } from '../services/auth.service';

const Receipt = ({ rideId, onClose }) => {
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(UserDataContext);
    const modalRef = useRef(null);

    // Move formatDateTime to component level
    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    useEffect(() => {
        const generateAndFetchReceipt = async () => {
            try {
                const token = getToken('user');
                if (!token) {
                    showToast.error('Please login to view receipt');
                    onClose();
                    return;
                }

                const generateResponse = await axios.post(
                    `${import.meta.env.VITE_BASE_URL}/api/receipts/generate/${rideId}`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setReceipt(generateResponse.data);
                setLoading(false);
            } catch (error) {
                console.error('Error generating/fetching receipt:', error);
                const errorMessage = error.response?.data?.message || 'Failed to load receipt';
                showToast.error(errorMessage);
                console.log('Full error:', error.response?.data);
                
                if (error.response?.status === 401) {
                    onClose();
                }
                setLoading(false);
            }
        };

        generateAndFetchReceipt();
    }, [rideId, onClose]);

    const handleDownload = async () => {
        try {
            showToast.info('Generating PDF...');

            // Create a new receipt structure for PDF
            const createReceiptHTML = () => {
                const container = document.createElement('div');
                container.style.cssText = `
                    width: 380px;
                    background-color: #ffffff;
                    padding: 16px;
                    font-family: monospace;
                    font-size: 11px;
                    line-height: 1.2;
                    color: #000000;
                `;

                // Company Header
                const header = document.createElement('div');
                header.style.cssText = `
                    text-align: center;
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px dashed #d1d5db;
                `;
                header.innerHTML = `
                    <div style="font-size: 16px; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 4px;">MYTAXY</div>
                    <div style="font-size: 10px; color: #6b7280; line-height: 1.25;">TAXI SERVICE RECEIPT</div>
                    <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">
                        ${formatDateTime(new Date())}
                    </div>
                `;

                // Receipt Details
                const receiptDetails = document.createElement('div');
                receiptDetails.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                `;
                receiptDetails.innerHTML = `
                    <div>
                        <div style="font-size: 10px; color: #6b7280;">RECEIPT NO</div>
                        <div style="font-weight: 500; letter-spacing: 0.025em;">${receipt.receiptNumber || 'N/A'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 10px; color: #6b7280;">DATE</div>
                        <div style="font-weight: 500; letter-spacing: 0.025em;">
                            ${formatDateTime(receipt.createdAt)}
                        </div>
                    </div>
                `;

                // Customer Details
                const customerSection = document.createElement('div');
                customerSection.style.cssText = `
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed #d1d5db;
                `;
                customerSection.innerHTML = `
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">CUSTOMER</div>
                    <div style="font-weight: 500; letter-spacing: 0.025em;">
                        ${receipt.user?.fullname?.firstname?.toUpperCase() || 'N/A'} ${receipt.user?.fullname?.lastname?.toUpperCase() || ''}
                    </div>
                    <div style="color: #4b5563; letter-spacing: 0.025em;">${receipt.user?.phone || 'N/A'}</div>
                    <div style="color: #4b5563; letter-spacing: 0.025em;">${receipt.user?.email || 'N/A'}</div>
                `;

                // Driver Details
                const driverSection = document.createElement('div');
                driverSection.style.cssText = `
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed #d1d5db;
                `;
                driverSection.innerHTML = `
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">CAPTAIN</div>
                    <div style="font-weight: 500; letter-spacing: 0.025em;">
                        ${receipt.captain?.fullname?.firstname?.toUpperCase() || 'N/A'} ${receipt.captain?.fullname?.lastname?.toUpperCase() || ''}
                    </div>
                    <div style="color: #4b5563; letter-spacing: 0.025em;">${receipt.captain?.phone || 'N/A'}</div>
                    <div style="color: #4b5563; letter-spacing: 0.025em;">
                        ${receipt.captain?.vehicle?.color?.toUpperCase() || 'N/A'} ${receipt.captain?.vehicle?.vehicleType?.toUpperCase() || 'N/A'} - ${receipt.captain?.vehicle?.plate || 'N/A'}
                    </div>
                `;

                // Trip Details
                const tripSection = document.createElement('div');
                tripSection.style.cssText = `
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed #d1d5db;
                `;
                tripSection.innerHTML = `
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">TRIP DETAILS</div>
                    <div style="margin-top: 4px;">
                        <div style="font-size: 10px; color: #6b7280;">FROM</div>
                        <div style="letter-spacing: 0.025em;">${receipt.rideDetails?.pickup?.address || receipt.ride?.pickupLocation || 'N/A'}</div>
                    </div>
                    <div style="margin-top: 4px;">
                        <div style="font-size: 10px; color: #6b7280;">TO</div>
                        <div style="letter-spacing: 0.025em;">${receipt.rideDetails?.destination?.address || receipt.ride?.dropoffLocation || 'N/A'}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
                        <div>
                            <div style="font-size: 10px; color: #6b7280;">DISTANCE</div>
                            <div style="letter-spacing: 0.025em;">${(receipt.rideDetails?.distance || receipt.ride?.distance || 0).toFixed(1)} km</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: #6b7280;">DURATION</div>
                            <div style="letter-spacing: 0.025em;">${Math.round(receipt.rideDetails?.duration || receipt.ride?.duration || 0)} mins</div>
                        </div>
                    </div>
                    
                `;

                // Payment Details
                const paymentSection = document.createElement('div');
                paymentSection.style.cssText = `
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed #d1d5db;
                `;
                paymentSection.innerHTML = `
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 2px;">PAYMENT DETAILS</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                        <span style="font-size: 10px; color: #6b7280;">PAYMENT METHOD</span>
                        <span style="font-weight: 500; letter-spacing: 0.025em; text-transform: capitalize;">
                         Online
                        </span>
                    </div>
                    ${receipt.payment?.method === 'upi' && receipt.payment?.upiId ? `
                    <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                        <span style="font-size: 10px; color: #6b7280;">UPI ID</span>
                        <span style="font-weight: 500; letter-spacing: 0.025em;">${receipt.payment.upiId}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                        <span style="font-size: 10px; color: #6b7280;">TRANSACTION ID</span>
                        <span style="font-weight: 500; letter-spacing: 0.025em;">${receipt.payment?.transactionId || receipt.transactionId || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #d1d5db; font-weight: bold;">
                        <span style="letter-spacing: 0.025em;">TOTAL AMOUNT</span>
                        <span style="letter-spacing: 0.025em;">₹${(receipt.payment?.amount || receipt.amount || 0).toFixed(2)}</span>
                    </div>
                `;

                // Footer
                const footer = document.createElement('div');
                footer.style.cssText = `
                    margin-top: 16px;
                    padding-top: 8px;
                    border-top: 1px dashed #d1d5db;
                    text-align: center;
                    font-size: 10px;
                    color: #6b7280;
                `;
                footer.innerHTML = `
                    <div style="letter-spacing: 0.025em;">THANK YOU FOR CHOOSING MYTAXY!</div>
                    <div style="color: #9ca3af; margin-top: 2px; letter-spacing: 0.025em;">THIS IS A COMPUTER GENERATED RECEIPT</div>
                    <div style="margin-top: 12px; color: #9ca3af; letter-spacing: 0.025em;">
                        ----------------------------------------
                    </div>
                `;

                // Assemble the receipt
                container.appendChild(header);
                container.appendChild(receiptDetails);
                container.appendChild(customerSection);
                container.appendChild(driverSection);
                container.appendChild(tripSection);
                container.appendChild(paymentSection);
                container.appendChild(footer);

                return container;
            };

            // Create the receipt container
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.appendChild(createReceiptHTML());
            document.body.appendChild(container);

            // Wait for styles to be applied
            await new Promise(resolve => setTimeout(resolve, 100));

            // Generate the PDF
            const canvas = await html2canvas(container.firstChild, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 380,
                height: container.firstChild.scrollHeight
            });

            // Clean up
            document.body.removeChild(container);

            // Calculate exact receipt dimensions (80mm width)
            const mmToPx = 3.7795275591; // 1mm = 3.7795275591px at 96 DPI
            const receiptWidth = 80; // 80mm width
            const receiptHeight = (canvas.height / mmToPx) * (receiptWidth / (canvas.width / mmToPx));

            // Create PDF with exact receipt dimensions
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [receiptWidth, receiptHeight]
            });

            // Add the image to PDF
            const imgData = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', 0, 0, receiptWidth, receiptHeight);

            // Generate filename
            const filename = `MyTaxy-Receipt-${receipt.receiptNumber}.pdf`;

            // Save the PDF
            pdf.save(filename);
            
            showToast.success('Receipt downloaded successfully');
        } catch (error) {
            console.error('Error downloading receipt:', error);
            showToast.error('Failed to download receipt. Please try again.');
        }
    };

    const handlePrint = () => {
        // Add print-specific styles before printing
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                @page {
                    size: A4 portrait;
                    margin: 0;
                    padding: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                body * {
                    visibility: hidden;
                }
                #receipt-content, #receipt-content * {
                    visibility: visible;
                }
                #receipt-content {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 80mm;
                    padding: 4mm;
                    background: white;
                    box-shadow: none;
                    margin: 0;
                    page-break-after: avoid;
                    page-break-before: avoid;
                    page-break-inside: avoid;
                    border: 1px solid #000;
                    border-radius: 4px;
                }
                .no-print {
                    display: none !important;
                }
                /* Hide scrollbar in print */
                * {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
                *::-webkit-scrollbar {
                    display: none !important;
                }
                /* Ensure single page */
                html, body {
                    height: 100%;
                    overflow: hidden;
                }
                #receipt-content {
                    max-height: 100vh;
                    overflow: hidden;
                }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fdc700]"></div>
                    <p className="mt-4 text-gray-600">Generating receipt...</p>
                </div>
            </div>
        );
    }

    if (!receipt) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center text-red-600">
                        <p>Failed to load receipt</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900/60 to-gray-800/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div ref={modalRef} className="bg-white rounded-lg shadow-2xl w-[380px] max-h-[90vh] flex flex-col">
                {/* Header with actions */}
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-lg no-print">
                    <h2 className="text-lg font-semibold text-gray-800"> Payment Receipt</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                            title="Download PDF"
                        >
                            <FaDownload className="w-5 h-5" />
                        </button>
                        
                        <button
                            onClick={handlePrint}
                            className="p-2 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                            title="Print Receipt"
                        >
                            <FaPrint className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                            title="Close"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                        </div>
                    ) : receipt ? (
                        <div id="receipt-content" className="p-4 rounded-lg bg-white">
                            {/* Company Header */}
                            <div className="text-center mb-3 pb-2 border-b border-dashed border-gray-300">
                                <h1 className="text-base font-bold tracking-wider mb-1">MYTAXY</h1>
                                <p className="text-[10px] text-gray-500">TAXI SERVICE RECEIPT</p>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {formatDateTime(new Date())}
                                </p>
                            </div>

                            {/* Receipt Details */}
                            <div className="space-y-1.5 text-[11px]">
                                {/* Receipt Number and Date */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-gray-500">RECEIPT NO</p>
                                        <p className="font-medium tracking-wider">{receipt.receiptNumber || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500">DATE</p>
                                        <p className="font-medium tracking-wider">
                                            {formatDateTime(receipt.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Customer Details */}
                                <div className="border-t border-dashed border-gray-300 pt-1.5">
                                    <p className="text-[10px] text-gray-500 mb-0.5">CUSTOMER</p>
                                    <p className="font-medium tracking-wider">
                                        {receipt.user?.fullname?.firstname?.toUpperCase() || 'N/A'} {receipt.user?.fullname?.lastname?.toUpperCase() || ''}
                                    </p>
                                    <p className="text-gray-600 tracking-wider">{receipt.user?.phone || 'N/A'}</p>
                                    <p className="text-gray-600 tracking-wider">{receipt.user?.email || 'N/A'}</p>
                                </div>

                                {/* Captain Details */}
                                <div className="border-t border-dashed border-gray-300 pt-1.5">
                                    <p className="text-[10px] text-gray-500 mb-0.5">CAPTAIN</p>
                                    <p className="font-medium tracking-wider">
                                        {receipt.captain?.fullname?.firstname?.toUpperCase() || 'N/A'} {receipt.captain?.fullname?.lastname?.toUpperCase() || ''}
                                    </p>
                                    <p className="text-gray-600 tracking-wider">{receipt.captain?.phone || 'N/A'}</p>
                                    <p className="text-gray-600 tracking-wider">
                                        {receipt.captain?.vehicle?.color?.toUpperCase() || 'N/A'} {receipt.captain?.vehicle?.vehicleType?.toUpperCase() || 'N/A'} - {receipt.captain?.vehicle?.plate || 'N/A'}
                                    </p>
                                </div>

                                {/* Trip Details */}
                                <div className="border-t border-dashed border-gray-300 pt-1.5">
                                    <p className="text-[10px] text-gray-500 mb-0.5">TRIP DETAILS</p>
                                    <div className="space-y-1.5">
                                        <div>
                                            <p className="text-[10px] text-gray-500">FROM</p>
                                            <p className="tracking-wider">{receipt.rideDetails?.pickup?.address || receipt.ride?.pickupLocation || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500">TO</p>
                                            <p className="tracking-wider">{receipt.rideDetails?.destination?.address || receipt.ride?.dropoffLocation || 'N/A'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-[10px] text-gray-500">DISTANCE</p>
                                                <p className="tracking-wider">{(receipt.rideDetails?.distance || receipt.ride?.distance || 0).toFixed(1)} km</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500">DURATION</p>
                                                <p className="tracking-wider">{Math.round(receipt.rideDetails?.duration || receipt.ride?.duration || 0)} mins</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="border-t border-dashed border-gray-300 pt-1.5">
                                    <p className="text-[10px] text-gray-500 mb-0.5">PAYMENT DETAILS</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-[10px] text-gray-500">PAYMENT METHOD</span>
                                            <span className="font-medium tracking-wider capitalize">
                                               Online
                                            </span>
                                        </div>
                                        {receipt.payment?.method === 'upi' && receipt.payment?.upiId && (
                                            <div className="flex justify-between">
                                                <span className="text-[10px] text-gray-500">UPI ID</span>
                                                <span className="font-medium tracking-wider">{receipt.payment.upiId}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-[10px] text-gray-500">TRANSACTION ID</span>
                                            <span className="font-medium tracking-wider">{receipt.payment?.transactionId || receipt.transactionId || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between pt-1 mt-1 border-t border-dashed border-gray-300">
                                            <span className="font-medium tracking-wider">TOTAL AMOUNT</span>
                                            <span className="font-bold tracking-wider">₹{(receipt.payment?.amount || receipt.amount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-3 pt-1.5 border-t border-dashed border-gray-300 text-center">
                                    <p className="text-[10px] tracking-wider">THANK YOU FOR CHOOSING MYTAXY!</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 tracking-wider">THIS IS A COMPUTER GENERATED RECEIPT</p>
                                    <p className="text-[10px] text-gray-400 mt-2 tracking-wider">
                                        ----------------------------------------
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600">No receipt data available</div>
                    )}
                </div>

                {/* Add style tag for scrollbar hiding */}
                <style jsx>{`
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default Receipt; 