import { useEffect, useMemo, useState } from 'react';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createDirectOrder } from '@/services/orderService';
import { useToast } from '@/components/ui/use-toast';

const JoinOrderDialog = ({ product, isOpen, onClose, onOrderPlaced }) => {
  const minQuantity = useMemo(
    () => Math.max(Number(product?.minOrderQty) || 1, 1),
    [product?.minOrderQty]
  );
  const availableQuantity = Number(product?.availableQty) || 0;
  const [quantity, setQuantity] = useState(minQuantity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) setQuantity(minQuantity);
  }, [isOpen, minQuantity]);

  const totalPrice = (Number(product?.pricePerKg) || 0) * (Number(quantity) || 0);
  const isOutOfStock = availableQuantity <= 0;

  const handleSubmit = async () => {
    const nextQuantity = Number(quantity);

    if (!Number.isFinite(nextQuantity) || nextQuantity < minQuantity) {
      toast({
        title: 'Invalid Quantity',
        description: `Please order at least ${minQuantity} ${product?.unit || 'unit'}.`,
        variant: 'destructive',
      });
      return;
    }

    if (availableQuantity > 0 && nextQuantity > availableQuantity) {
      toast({
        title: 'Not Enough Stock',
        description: `Only ${availableQuantity} ${product?.unit || 'unit'} available.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createDirectOrder(product._id, nextQuantity);
      toast({
        title: 'Order Placed!',
        description: `${nextQuantity} ${product?.unit || 'unit'} of ${product.name} added to your orders.`,
      });
      onOrderPlaced?.();
      onClose?.();
    } catch (err) {
      toast({
        title: 'Order Failed',
        description: err.response?.data?.msg || 'Could not place order.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order {product.name}</DialogTitle>
          <DialogDescription>
            Choose how much you want to order from this artisan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Price</span>
              <span className="font-semibold">₹{product.pricePerKg}/{product.unit}</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum order</span>
              <span className="font-semibold">{minQuantity} {product.unit}</span>
            </div>
            <div className="flex justify-between">
              <span>Available stock</span>
              <span className="font-semibold">{availableQuantity} {product.unit}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-quantity">Quantity ({product.unit})</Label>
            <Input
              id="order-quantity"
              type="number"
              min={minQuantity}
              max={availableQuantity || undefined}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isOutOfStock || isSubmitting}
            />
          </div>

          <div className="flex justify-between border-t pt-3 text-sm">
            <span className="text-gray-600">Estimated total</span>
            <span className="text-lg font-bold text-green-700">₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isOutOfStock || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            Place Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinOrderDialog;
