import React, { useEffect, useRef } from 'react';

interface GooglePayButtonProps {
  amount: string;
  tier: 'BASIC' | 'PRO';
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const GooglePayButton: React.FC<GooglePayButtonProps> = ({ amount, tier, onSuccess, onError }) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
  };

  const allowedPaymentMethods = [
    {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          'gateway': 'example', // Replace with your actual gateway name (e.g., 'paytr', 'iyzico')
          'gatewayMerchantId': 'exampleGatewayMerchantId', // Replace with your actual merchant ID
        },
      },
    },
  ];

  const isReadyToPayRequest = Object.assign({}, baseRequest, {
    allowedPaymentMethods: allowedPaymentMethods,
  });

  const paymentDataRequest = Object.assign({}, baseRequest, {
    allowedPaymentMethods: allowedPaymentMethods,
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: amount,
      currencyCode: 'TRY',
      countryCode: 'TR',
    },
    merchantInfo: {
      merchantName: 'Tekno Nova',
      merchantId: 'BCR2DN4TU77OT2CA', // Updated with user provided Merchant ID
    },
  });

  useEffect(() => {
    const onGooglePayLoaded = () => {
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: 'PRODUCTION', // Changed to PRODUCTION for live
      });

      paymentsClient
        .isReadyToPay(isReadyToPayRequest)
        .then((response: any) => {
          if (response.result) {
            const button = paymentsClient.createButton({
              onClick: () => {
                paymentsClient
                  .loadPaymentData(paymentDataRequest)
                  .then((paymentData: any) => {
                    onSuccess(paymentData);
                  })
                  .catch((err: any) => {
                    onError(err);
                  });
              },
              buttonColor: 'black',
              buttonType: 'buy',
              buttonSizeMode: 'fill',
            });
            if (buttonRef.current) {
              buttonRef.current.innerHTML = '';
              buttonRef.current.appendChild(button);
            }
          }
        })
        .catch((err: any) => {
          console.error('isReadyToPay error:', err);
        });
    };

    if (window.google && window.google.payments) {
      onGooglePayLoaded();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.payments) {
          onGooglePayLoaded();
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [amount, tier]);

  return <div ref={buttonRef} className="w-full h-10 overflow-hidden rounded-xl" />;
};

export default GooglePayButton;
