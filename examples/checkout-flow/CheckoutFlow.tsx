import React, { useState } from 'react';
import { useRecovery, useJourney } from '../../src';
import { CheckoutJourneyData, ShippingAddress, DeliveryMethod } from './types';

/**
 * Example multi-step checkout workflow demonstrating recovery lifecycle,
 * incremental checkpoints, user prompts, and completion cleanup.
 */
export const CheckoutFlow: React.FC = () => {
  const recovery = useRecovery<CheckoutJourneyData>('checkout');
  const journey = useJourney<CheckoutJourneyData>('checkout', {
    version: 1,
    expiry: 24 * 60 * 60 * 1000, // 24 hours
  });

  const [step, setStep] = useState<'cart' | 'shipping' | 'delivery' | 'review'>('cart');
  const [cartItems] = useState([
    { id: 'item_1', name: 'Wireless Headphones', price: 99, quantity: 1 },
  ]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    postalCode: '',
  });
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard');
  const [orderCompleted, setOrderCompleted] = useState(false);

  // 1. Recovery Prompt UI if unfinished checkout is detected
  if (recovery.available && step === 'cart' && recovery.snapshot) {
    const lastSaved = new Date(recovery.snapshot.updatedAt).toLocaleTimeString();
    return (
      <div style={{ padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
        <h3>Unfinished Checkout Found</h3>
        <p>Would you like to resume where you left off? (Last saved at {lastSaved})</p>
        <button
          onClick={async () => {
            const restored = await recovery.restore();
            setStep(restored.step);
            if (restored.shippingAddress) setShippingAddress(restored.shippingAddress);
            if (restored.deliveryMethod) setDeliveryMethod(restored.deliveryMethod);
          }}
        >
          Resume Checkout
        </button>
        <button
          onClick={async () => {
            await recovery.discard();
          }}
          style={{ marginLeft: 12 }}
        >
          Start Over
        </button>
      </div>
    );
  }

  if (orderCompleted) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Order Confirmed!</h2>
        <p>Thank you for your purchase.</p>
      </div>
    );
  }

  // 2. Step 1: Cart Screen
  if (step === 'cart') {
    return (
      <div style={{ padding: 24 }}>
        <h2>Shopping Cart</h2>
        {cartItems.map((item) => (
          <div key={item.id}>
            {item.name} - ${item.price} x {item.quantity}
          </div>
        ))}
        <button
          onClick={async () => {
            // Save checkpoint before moving to shipping
            await journey.checkpoint({
              step: 'shipping',
              cartItems,
            });
            setStep('shipping');
          }}
          style={{ marginTop: 16 }}
        >
          Proceed to Shipping
        </button>
      </div>
    );
  }

  // 3. Step 2: Shipping Screen
  if (step === 'shipping') {
    return (
      <div style={{ padding: 24 }}>
        <h2>Shipping Address</h2>
        <div>
          <label>Street: </label>
          <input
            value={shippingAddress.street}
            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>City: </label>
          <input
            value={shippingAddress.city}
            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
          />
        </div>
        <button
          onClick={async () => {
            // Checkpoint shipping address
            await journey.checkpoint({
              step: 'delivery',
              cartItems,
              shippingAddress,
            });
            setStep('delivery');
          }}
          style={{ marginTop: 16 }}
        >
          Choose Delivery Method
        </button>
      </div>
    );
  }

  // 4. Step 3: Delivery Options Screen
  if (step === 'delivery') {
    return (
      <div style={{ padding: 24 }}>
        <h2>Delivery Method</h2>
        <div>
          <label>
            <input
              type="radio"
              checked={deliveryMethod === 'standard'}
              onChange={() => setDeliveryMethod('standard')}
            />
            Standard ($5)
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              checked={deliveryMethod === 'express'}
              onChange={() => setDeliveryMethod('express')}
            />
            Express ($15)
          </label>
        </div>
        <button
          onClick={async () => {
            await journey.checkpoint({
              step: 'review',
              cartItems,
              shippingAddress,
              deliveryMethod,
            });
            setStep('review');
          }}
          style={{ marginTop: 16 }}
        >
          Review Order
        </button>
      </div>
    );
  }

  // 5. Step 4: Final Review & Order Placement
  return (
    <div style={{ padding: 24 }}>
      <h2>Order Review</h2>
      <p>Items: {cartItems.length}</p>
      <p>Shipping to: {shippingAddress.street}, {shippingAddress.city}</p>
      <p>Delivery: {deliveryMethod}</p>
      <button
        onClick={async () => {
          // Final purchase: clear checkpoint upon completion
          await journey.clear();
          setOrderCompleted(true);
        }}
      >
        Place Order & Pay
      </button>
    </div>
  );
};

