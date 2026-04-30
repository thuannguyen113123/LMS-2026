import React from "react";
import { Link } from "react-router-dom";
import { FiShoppingCart, FiX } from "react-icons/fi";

const CartHover = ({
  items = [],
  totalItems = 0,
  subtotal = 0,
  removeItem,
}) => {
  return (
    <div className="relative group">
      <button className="relative flex h-10 w-10 items-center justify-center text-gray-700 dark:text-gray-300 hover:text-indigo-500 transition">
        <FiShoppingCart size={22} />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      <div className="dropdown-menu right-0 dropdown-left-adjust">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold flex justify-between items-center">
          Cart
          <span className="text-sm text-gray-500">{totalItems} item(s)</span>
        </div>

        {items.length === 0 ? (
          <div className=" text-center text-gray-500 text-sm flex justify-center items-center py-2 gap-1">
            <FiShoppingCart size={48} /> <span>Your cart is empty</span>
          </div>
        ) : (
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <img
                  src={item.coverImage || "https://via.placeholder.com/40"}
                  alt={item.name}
                  className="w-10 h-10 rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.isFree ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : item.discountPrice &&
                      Number(item.discountPrice) < Number(item.price) ? (
                      <>
                        <span className="text-red-500 font-semibold">
                          ${Number(item.discountPrice).toFixed(2)}
                        </span>{" "}
                        <span className="line-through text-gray-400">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span>${Number(item.price).toFixed(2)}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <FiX size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Total:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2 mt-2">
              <Link
                to="/cart"
                className="w-1/2 text-center py-2 border rounded-md text-gray-700 dark:text-gray-100 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                className="w-1/2 text-center py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartHover;
