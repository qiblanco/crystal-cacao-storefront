import {CartForm} from '@shopify/hydrogen';

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   clearDiscountCodes?: boolean;
 *   disabled?: boolean;
 *   discountCode?: string;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 * }}
 */
export function AddToCartButton({
  analytics,
  children,
  clearDiscountCodes,
  disabled,
  discountCode,
  lines,
  onClick,
}) {
  const inputs = {
    lines,
    ...(discountCode ? {discountCode} : {}),
    ...(clearDiscountCodes ? {clearDiscountCodes: true} : {}),
  };

  return (
    <CartForm
      route="/cart"
      inputs={inputs}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button className='btn--primary'
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
