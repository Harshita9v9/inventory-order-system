import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "customers", label: "Customers" },
  { key: "orders", label: "Orders" },
];

const initialProductForm = { name: "", sku: "", price: "", quantity: "" };
const initialCustomerForm = { full_name: "", email: "", phone_number: "" };
const initialOrderForm = { customer_id: "", product_id: "", quantity: "" };

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const [productForm, setProductForm] = useState(initialProductForm);
  const [productErrors, setProductErrors] = useState({});
  const [editingProductId, setEditingProductId] = useState(null);

  const [customerForm, setCustomerForm] = useState(initialCustomerForm);
  const [customerErrors, setCustomerErrors] = useState({});

  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [orderErrors, setOrderErrors] = useState({});

  async function refreshAll() {
    setLoading(true);
    try {
      const [productsData, customersData, ordersData, dashboardData] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getOrders(),
        api.getDashboardSummary(),
      ]);
      setProducts(productsData);
      setCustomers(customersData);
      setOrders(ordersData);
      setDashboard(dashboardData);
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  function showNotice(type, message) {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 3500);
  }

  function validateProductForm(values) {
    const errors = {};
    if (!values.name.trim()) errors.name = "Name is required.";
    if (!values.sku.trim()) errors.sku = "SKU is required.";
    if (!values.price || Number(values.price) <= 0) errors.price = "Price must be greater than 0.";
    if (values.quantity === "" || Number(values.quantity) < 0) {
      errors.quantity = "Quantity must be 0 or greater.";
    }
    return errors;
  }

  function validateCustomerForm(values) {
    const errors = {};
    if (!values.full_name.trim()) errors.full_name = "Full name is required.";
    if (!values.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      errors.email = "Email format is invalid.";
    }
    if (!values.phone_number.trim()) errors.phone_number = "Phone number is required.";
    return errors;
  }

  function validateOrderForm(values) {
    const errors = {};
    if (!values.customer_id) errors.customer_id = "Select a customer.";
    if (!values.product_id) errors.product_id = "Select a product.";
    if (!values.quantity || Number(values.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0.";
    }
    return errors;
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    const errors = validateProductForm(productForm);
    setProductErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      quantity: Number(productForm.quantity),
    };

    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        showNotice("success", "Product updated successfully.");
      } else {
        await api.createProduct(payload);
        showNotice("success", "Product created successfully.");
      }
      setProductForm(initialProductForm);
      setEditingProductId(null);
      await refreshAll();
    } catch (error) {
      showNotice("error", error.message);
    }
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      showNotice("success", "Product deleted.");
      await refreshAll();
    } catch (error) {
      showNotice("error", error.message);
    }
  }

  async function handleCustomerSubmit(event) {
    event.preventDefault();
    const errors = validateCustomerForm(customerForm);
    setCustomerErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      await api.createCustomer(customerForm);
      showNotice("success", "Customer created successfully.");
      setCustomerForm(initialCustomerForm);
      await refreshAll();
    } catch (error) {
      showNotice("error", error.message);
    }
  }

  async function handleDeleteCustomer(id) {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await api.deleteCustomer(id);
      showNotice("success", "Customer deleted.");
      await refreshAll();
    } catch (error) {
      showNotice("error", error.message);
    }
  }

  async function handleOrderSubmit(event) {
    event.preventDefault();
    const errors = validateOrderForm(orderForm);
    setOrderErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      await api.createOrder({
        customer_id: Number(orderForm.customer_id),
        product_id: Number(orderForm.product_id),
        quantity: Number(orderForm.quantity),
      });
      showNotice("success", "Order placed successfully.");
      setOrderForm(initialOrderForm);
      await refreshAll();
    } catch (error) {
      showNotice("error", error.message);
    }
  }

  const selectedView = useMemo(() => {
    if (loading) {
      return <p className="rounded-lg bg-white p-5 shadow">Loading data...</p>;
    }
    if (activeView === "dashboard") {
      return <DashboardView dashboard={dashboard} />;
    }
    if (activeView === "products") {
      return (
        <ProductsView
          products={products}
          productForm={productForm}
          setProductForm={setProductForm}
          productErrors={productErrors}
          onSubmit={handleProductSubmit}
          onDelete={handleDeleteProduct}
          onEdit={(product) => {
            setEditingProductId(product.id);
            setProductForm({
              name: product.name,
              sku: product.sku,
              price: product.price,
              quantity: product.quantity,
            });
            setProductErrors({});
          }}
          editingProductId={editingProductId}
          onCancelEdit={() => {
            setEditingProductId(null);
            setProductForm(initialProductForm);
            setProductErrors({});
          }}
        />
      );
    }
    if (activeView === "customers") {
      return (
        <CustomersView
          customers={customers}
          customerForm={customerForm}
          setCustomerForm={setCustomerForm}
          customerErrors={customerErrors}
          onSubmit={handleCustomerSubmit}
          onDelete={handleDeleteCustomer}
        />
      );
    }
    return (
      <OrdersView
        orders={orders}
        products={products}
        customers={customers}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        orderErrors={orderErrors}
        onSubmit={handleOrderSubmit}
      />
    );
  }, [
    activeView,
    customerErrors,
    customerForm,
    customers,
    dashboard,
    editingProductId,
    loading,
    orderErrors,
    orderForm,
    orders,
    productErrors,
    productForm,
    products,
  ]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-slate-900">Inventory & Order Management</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="rounded-xl bg-white p-3 shadow-sm">
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium ${
                  activeView === item.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="space-y-4">
          {notice && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {notice.message}
            </div>
          )}
          {selectedView}
        </main>
      </div>
    </div>
  );
}

function DashboardView({ dashboard }) {
  const cards = [
    { title: "Total Products", value: dashboard?.total_products ?? 0 },
    { title: "Total Customers", value: dashboard?.total_customers ?? 0 },
    { title: "Total Orders", value: dashboard?.total_orders ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Low Stock Products</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Stock</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.low_stock_products || []).map((product) => (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2">{product.sku}</td>
                  <td className="px-3 py-2 font-semibold text-amber-600">{product.quantity}</td>
                </tr>
              ))}
              {!dashboard?.low_stock_products?.length && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={3}>
                    No low stock products.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ProductsView({
  products,
  productForm,
  setProductForm,
  productErrors,
  onSubmit,
  onDelete,
  onEdit,
  editingProductId,
  onCancelEdit,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{editingProductId ? "Update Product" : "Add Product"}</h2>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <Field
            label="Name"
            value={productForm.name}
            onChange={(value) => setProductForm((old) => ({ ...old, name: value }))}
            error={productErrors.name}
          />
          <Field
            label="SKU"
            value={productForm.sku}
            onChange={(value) => setProductForm((old) => ({ ...old, sku: value }))}
            error={productErrors.sku}
          />
          <Field
            label="Price"
            type="number"
            step="0.01"
            min="0.01"
            value={productForm.price}
            onChange={(value) => setProductForm((old) => ({ ...old, price: value }))}
            error={productErrors.price}
          />
          <Field
            label="Quantity"
            type="number"
            min="0"
            value={productForm.quantity}
            onChange={(value) => setProductForm((old) => ({ ...old, quantity: value }))}
            error={productErrors.quantity}
          />
          <div className="flex gap-2">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" type="submit">
              {editingProductId ? "Update Product" : "Add Product"}
            </button>
            {editingProductId && (
              <button
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-300"
                type="button"
                onClick={onCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Products</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2">{product.sku}</td>
                  <td className="px-3 py-2">${Number(product.price).toFixed(2)}</td>
                  <td className="px-3 py-2">{product.quantity}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200"
                        onClick={() => onEdit(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200"
                        onClick={() => onDelete(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={5}>
                    No products available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CustomersView({
  customers,
  customerForm,
  setCustomerForm,
  customerErrors,
  onSubmit,
  onDelete,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add Customer</h2>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <Field
            label="Full Name"
            value={customerForm.full_name}
            onChange={(value) => setCustomerForm((old) => ({ ...old, full_name: value }))}
            error={customerErrors.full_name}
          />
          <Field
            label="Email"
            type="email"
            value={customerForm.email}
            onChange={(value) => setCustomerForm((old) => ({ ...old, email: value }))}
            error={customerErrors.email}
          />
          <Field
            label="Phone Number"
            value={customerForm.phone_number}
            onChange={(value) => setCustomerForm((old) => ({ ...old, phone_number: value }))}
            error={customerErrors.phone_number}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" type="submit">
            Add Customer
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Customers</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{customer.full_name}</td>
                  <td className="px-3 py-2">{customer.email}</td>
                  <td className="px-3 py-2">{customer.phone_number}</td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200"
                      onClick={() => onDelete(customer.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!customers.length && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    No customers available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function OrdersView({
  orders,
  products,
  customers,
  orderForm,
  setOrderForm,
  orderErrors,
  onSubmit,
}) {
  const customerById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers]
  );
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create Order</h2>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <SelectField
            label="Customer"
            value={orderForm.customer_id}
            onChange={(value) => setOrderForm((old) => ({ ...old, customer_id: value }))}
            options={customers.map((customer) => ({ value: customer.id, label: customer.full_name }))}
            error={orderErrors.customer_id}
          />
          <SelectField
            label="Product"
            value={orderForm.product_id}
            onChange={(value) => setOrderForm((old) => ({ ...old, product_id: value }))}
            options={products.map((product) => ({
              value: product.id,
              label: `${product.name} (${product.sku}) - Stock: ${product.quantity}`,
            }))}
            error={orderErrors.product_id}
          />
          <Field
            label="Quantity"
            type="number"
            min="1"
            value={orderForm.quantity}
            onChange={(value) => setOrderForm((old) => ({ ...old, quantity: value }))}
            error={orderErrors.quantity}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" type="submit">
            Place Order
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Order History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const customer = customerById.get(order.customer_id);
                const product = productById.get(order.product_id);
                return (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">#{order.id}</td>
                    <td className="px-3 py-2">{customer?.full_name || `Customer #${order.customer_id}`}</td>
                    <td className="px-3 py-2">{product?.name || `Product #${order.product_id}`}</td>
                    <td className="px-3 py-2">{order.quantity}</td>
                    <td className="px-3 py-2">${Number(order.total_amount).toFixed(2)}</td>
                  </tr>
                );
              })}
              {!orders.length && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={5}>
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, error, onChange, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, error }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
