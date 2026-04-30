import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Download,
  Edit3,
  Eye,
  ImagePlus,
  Mail,
  PackageCheck,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import {
  archiveAdminProduct,
  createAdminProduct,
  deleteAdminProductImage,
  getBrands,
  getAdminProducts,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../../services/catalogService";
import { getAdminCustomers } from "../../services/commerceService";
import { notifyError, notifySuccess } from "../../utils/Toast";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "No activity";

const downloadCsv = (filename, rows) => {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const pageMeta = {
  products: {
    eyebrow: "Catalog",
    title: "Products",
    description: "Create products, update pricing, control stock, manage sale pricing, upload media, and map vehicle fitment.",
    icon: Boxes,
  },
  customers: {
    eyebrow: "Customers",
    title: "Customers",
    description: "Review customer accounts, spend, order volume, and latest order activity.",
    icon: UsersRound,
  },
  settings: {
    eyebrow: "Configuration",
    title: "Settings",
    description: "Demo-ready settings surface for brand, notification, and fulfillment preferences.",
    icon: Settings,
  },
};

const blankCompatibility = {
  brandId: "",
  modelId: "",
  yearFrom: "",
  yearTo: "",
  engineType: "",
  notes: "",
};

const toCompatibilityDraft = (compatibility) => ({
  brandId: compatibility.brand?.id || compatibility.brandId || "",
  modelId: compatibility.model?.id || compatibility.modelId || "",
  yearFrom: compatibility.yearFrom || "",
  yearTo: compatibility.yearTo || "",
  engineType:
    compatibility.engineType || compatibility.engine?.engineType || "",
  notes: compatibility.notes || "",
});

const extractCloudinaryPublicId = (url) => {
  if (!url || !String(url).includes("/upload/")) return "";

  const [, afterUpload = ""] = String(url).split("/upload/");
  const withoutVersion = afterUpload.replace(/^v\d+\//, "");
  const withoutExtension = withoutVersion.replace(/\.[a-z0-9]+$/i, "");
  return withoutExtension;
};

const AdminPlaceholderPage = ({ type }) => {
  const meta = pageMeta[type] || pageMeta.settings;
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(type !== "settings");
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDraft, setProductDraft] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({
    brandName: "AutoCore",
    contactEmail: "support@autocore.local",
    defaultCourier: "Leopard Courier",
    handlingDays: "2",
    confirmationDelay: "2",
    deliveryEmails: true,
    lowStockAlerts: true,
  });

  useEffect(() => {
    document.title = `AutoCore Admin ${meta.title}`;
    setQuery("");
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setProductDraft(null);

    if (type === "products") {
      setLoading(true);
      Promise.all([getAdminProducts({ limit: 100, status: "ALL" }), getBrands()])
        .then(([{ products: nextProducts }, nextBrands]) => {
          setProducts(nextProducts);
          setBrands(nextBrands);
        })
        .catch(() => notifyError("Could not load products."))
        .finally(() => setLoading(false));
    }

    if (type === "customers") {
      setLoading(true);
      getAdminCustomers()
        .then(setCustomers)
        .catch(() => notifyError("Could not load customers."))
        .finally(() => setLoading(false));
    }
  }, [meta.title, type]);

  const productStats = useMemo(
    () => ({
      total: products.length,
      inStock: products.filter((item) => item.inStock).length,
      lowStock: products.filter((item) => Number(item.stock || 0) <= 5).length,
    }),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) =>
      [product.name, product.sku, product.category, product.brand]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [products, query]);

  const visibleCustomers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.status,
        customer.latestOrder?.orderNumber,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [customers, query]);

  const customerStats = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter((customer) => customer.status === "ACTIVE").length,
      revenue: customers.reduce(
        (sum, customer) => sum + Number(customer.totalSpent || 0),
        0
      ),
    }),
    [customers]
  );

  const exportProducts = () => {
    downloadCsv("autocore-products.csv", [
      ["Product", "SKU", "Category", "Price", "Stock", "Status"],
      ...visibleProducts.map((product) => [
        product.name,
        product.sku,
        product.category,
        product.price,
        product.stock,
        product.inStock ? "In stock" : "Out of stock",
      ]),
    ]);
  };

  const openProduct = (product) => {
    setSelectedProduct(product);
    setProductDraft({
      name: product.name || "",
      sku: product.sku || "",
      partNumber: product.partNumber || product.sku || "",
      shortDescription: product.shortDescription || product.subtitle || "",
      category: product.category || "",
      price: product.price || 0,
      originalPrice: product.originalPrice || "",
      stock: product.stock || 0,
      lowStockThreshold: product.inventory?.lowStockThreshold ?? 5,
      warehouseLocation: product.inventory?.warehouseLocation || "",
      status: product.status || "ACTIVE",
      image: product.image || "",
      imagePublicId: extractCloudinaryPublicId(product.image),
      inStock: Boolean(product.inStock),
      compatibilities: (product.compatibilities || []).map(toCompatibilityDraft),
    });
  };

  const openNewProduct = () => {
    setSelectedProduct({
      id: null,
      name: "New product",
      image: "",
      sku: "",
    });
    setProductDraft({
      name: "",
      sku: "",
      partNumber: "",
      shortDescription: "",
      category: "Auto Parts",
      price: "",
      originalPrice: "",
      stock: 10,
      lowStockThreshold: 5,
      warehouseLocation: "",
      status: "ACTIVE",
      image: "",
      imagePublicId: "",
      inStock: true,
      compatibilities: [{ ...blankCompatibility }],
    });
  };

  const updateProductDraft = (field, value) => {
    setProductDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCompatibilityDraft = (index, field, value) => {
    setProductDraft((current) => ({
      ...current,
      compatibilities: (current.compatibilities || []).map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "brandId") {
          return {
            ...item,
            brandId: value,
            modelId: "",
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    }));
  };

  const addCompatibilityDraft = () => {
    setProductDraft((current) => ({
      ...current,
      compatibilities: [
        ...(current.compatibilities || []),
        { ...blankCompatibility },
      ],
    }));
  };

  const removeCompatibilityDraft = (index) => {
    setProductDraft((current) => ({
      ...current,
      compatibilities: (current.compatibilities || []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const getModelsForBrand = (brandId) =>
    brands.find((brand) => brand.id === brandId)?.models || [];

  const handleProductImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageUploading(true);
    try {
      const asset = await uploadAdminProductImage(file);
      setProductDraft((current) => ({
        ...current,
        image: asset.url,
        imagePublicId: asset.publicId,
      }));
      notifySuccess("Image uploaded to Cloudinary.");
    } catch (error) {
      notifyError(error?.response?.data?.message || "Could not upload image.");
    } finally {
      setImageUploading(false);
    }
  };

  const removeProductImage = async () => {
    const publicId =
      productDraft.imagePublicId || extractCloudinaryPublicId(productDraft.image);

    if (publicId) {
      setImageUploading(true);
      try {
        await deleteAdminProductImage(publicId);
        notifySuccess("Image deleted from Cloudinary.");
      } catch (error) {
        notifyError(error?.response?.data?.message || "Could not delete Cloudinary image.");
        setImageUploading(false);
        return;
      }
    }

    setProductDraft((current) => ({
      ...current,
      image: "",
      imagePublicId: "",
    }));
    setImageUploading(false);
  };

  const saveProductDraft = async () => {
    setSavingProduct(true);
    try {
      const compatibilities = (productDraft.compatibilities || [])
        .filter((item) => item.brandId)
        .map((item) => ({
          brandId: item.brandId,
          modelId: item.modelId || null,
          yearFrom: item.yearFrom === "" ? null : Number(item.yearFrom),
          yearTo: item.yearTo === "" ? null : Number(item.yearTo),
          engineType: item.engineType || null,
          notes: item.notes || null,
        }));
      const payload = {
        ...productDraft,
        price: Number(productDraft.price || 0),
        originalPrice:
          productDraft.originalPrice === "" ? null : Number(productDraft.originalPrice),
        stock: Number(productDraft.stock || 0),
        lowStockThreshold: Number(productDraft.lowStockThreshold || 0),
        warehouseLocation: productDraft.warehouseLocation || null,
        inStock: Boolean(productDraft.inStock),
        compatibilities,
      };
      const savedProduct = selectedProduct.id
        ? await updateAdminProduct(selectedProduct.id, payload)
        : await createAdminProduct(payload);

      setProducts((current) => {
        if (!selectedProduct.id) return [savedProduct, ...current];
        return current.map((product) =>
          product.id === savedProduct.id ? savedProduct : product
        );
      });
      notifySuccess(selectedProduct.id ? "Product updated." : "Product created.");
      setSelectedProduct(null);
      setProductDraft(null);
    } catch (error) {
      notifyError(error?.response?.data?.message || "Could not save product.");
    } finally {
      setSavingProduct(false);
    }
  };

  const archiveProduct = async () => {
    if (!selectedProduct?.id) return;

    setSavingProduct(true);
    try {
      const archivedProduct = await archiveAdminProduct(selectedProduct.id);
      setProducts((current) =>
        current.map((product) =>
          product.id === archivedProduct.id ? archivedProduct : product
        )
      );
      notifySuccess("Product archived.");
      setSelectedProduct(null);
      setProductDraft(null);
    } catch (error) {
      notifyError(error?.response?.data?.message || "Could not archive product.");
    } finally {
      setSavingProduct(false);
    }
  };

  const saveSettings = () => {
    notifySuccess("Settings saved for this demo session.");
  };

  const exportCustomers = () => {
    downloadCsv("autocore-customers.csv", [
      ["Customer", "Email", "Phone", "Orders", "Total Spent", "Latest Order", "Status"],
      ...visibleCustomers.map((customer) => [
        customer.name,
        customer.email,
        customer.phone,
        customer.orderCount,
        customer.totalSpent,
        customer.latestOrder?.orderNumber,
        customer.status,
      ]),
    ]);
  };

  const renderSearchBar = (placeholder, onExport, action = null) => (
    <div className="mb-5 flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full text-sm outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {action}
        <button
          type="button"
          onClick={onExport}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#1572D3] px-4 py-2 text-sm font-semibold text-white"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-5 py-1">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg bg-white shadow-sm">
            <div className="m-5 h-5 rounded bg-slate-100" />
            <div className="mx-5 h-8 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-4">
      {loading ? (
        renderSkeleton()
      ) : type === "products" ? (
        <>
          {renderSearchBar(
            "Search products by name, SKU, category, or brand...",
            exportProducts,
            <button
              type="button"
              onClick={openNewProduct}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#1572D3]/20 px-4 py-2 text-sm font-semibold text-[#1572D3] hover:bg-[#E8F1FB]"
            >
              <Boxes className="h-4 w-4" />
              New Product
            </button>
          )}
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            {[
              ["Products", productStats.total],
              ["In stock", productStats.inStock],
              ["Low stock", productStats.lowStock],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[#2B3674]">{value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg bg-[#F7FBFF] object-contain p-2"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.category}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.status === "ARCHIVED" ? "bg-slate-100 text-slate-500" : product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {product.status === "ARCHIVED"
                          ? "Archived"
                          : product.inStock
                            ? "In stock"
                            : "Out of stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openProduct(product)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 className="h-4 w-4" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleProducts.length && (
              <div className="grid min-h-52 place-items-center border-t border-slate-100 text-center">
                <div>
                  <Boxes className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-lg font-bold text-slate-950">
                    No products found
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try another product name, SKU, or category.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : type === "customers" ? (
        <>
          {renderSearchBar("Search customers by name, email, phone, or order...", exportCustomers)}
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            {[
              ["Customers", customerStats.total],
              ["Active accounts", customerStats.active],
              ["Customer revenue", formatCurrency(customerStats.revenue)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-bold text-[#2B3674]">{value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Total spent</th>
                  <th className="px-4 py-3">Latest order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{customer.name}</p>
                      <p className="text-xs text-slate-500">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3">{customer.orderCount}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {customer.latestOrder?.orderNumber || "No orders"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#E8F1FB] px-2.5 py-1 text-xs font-bold text-[#1572D3]">
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleCustomers.length && (
              <div className="grid min-h-52 place-items-center border-t border-slate-100 text-center">
                <div>
                  <UsersRound className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-lg font-bold text-slate-950">
                    No customers found
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try another name, email, or order number.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-950">Admin preferences</p>
                <p className="text-xs text-slate-500">
                  Demo-safe controls for brand, fulfillment, and notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={saveSettings}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1572D3] px-4 py-2 text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["brandName", "Brand name", "AutoCore"],
                ["contactEmail", "Support email", "support@autocore.local"],
                ["defaultCourier", "Default courier", "Leopard Courier"],
                ["handlingDays", "Handling days", "2"],
                ["confirmationDelay", "Confirmation email delay", "2"],
              ].map(([field, label, placeholder]) => (
                <label key={field} className="block">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    {label}
                  </span>
                  <input
                    value={settingsDraft[field]}
                    onChange={(event) =>
                      setSettingsDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    placeholder={placeholder}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["deliveryEmails", "Delivery confirmation emails"],
                ["lowStockAlerts", "Low stock alerts"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 p-4"
                >
                  <span className="font-semibold text-slate-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={settingsDraft[field]}
                    onChange={(event) =>
                      setSettingsDraft((current) => ({
                        ...current,
                        [field]: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#1572D3]"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            {[
              {
                title: "Brand settings",
                copy: "Logo, storefront name, colors, and public contact details.",
                icon: ShieldCheck,
              },
              {
                title: "Notifications",
                copy: "Delivery confirmation email provider and reminder timing.",
                icon: Mail,
              },
              {
                title: "Fulfillment",
                copy: "Default courier, handling time, and delivery estimate rules.",
                icon: PackageCheck,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg bg-white p-5 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#E8F1FB] text-[#1572D3]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProduct && productDraft && (
        <div className="fixed inset-0 z-[140]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => {
              setSelectedProduct(null);
              setProductDraft(null);
            }}
            aria-label="Close product details"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1572D3]">
                  Product Control
                </p>
                <h3 className="text-xl font-bold text-slate-950">
                  {selectedProduct.id ? selectedProduct.name : "Create product"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setProductDraft(null);
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-lg bg-[#F7FBFF] p-4">
                <div className="flex items-center gap-4">
                <img
                  src={productDraft.image || selectedProduct.image}
                  alt={productDraft.name || selectedProduct.name}
                  className="h-24 w-24 rounded-lg bg-white object-contain p-3"
                />
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Preview</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {productDraft.name || "New product"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {productDraft.sku || "SKU pending"}
                  </p>
                </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1572D3] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]">
                    <ImagePlus className="h-4 w-4" />
                    {imageUploading ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleProductImageUpload}
                      disabled={imageUploading}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={removeProductImage}
                    disabled={imageUploading || !productDraft.image}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Image
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Upload stores the image in Cloudinary and writes the secure URL
                  into the product image field below.
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-900">Product basics</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    ["name", "Product name"],
                    ["sku", "SKU"],
                    ["partNumber", "Part number"],
                    ["category", "Category"],
                    ["shortDescription", "Short description"],
                    ["image", "Primary image URL"],
                  ].map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="text-xs font-bold uppercase text-slate-400">
                        {label}
                      </span>
                      <input
                        value={productDraft[field]}
                        onChange={(event) => updateProductDraft(field, event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Pricing and sale
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Set the selling price. Add an original price higher than
                      selling price to mark this product as on sale.
                    </p>
                  </div>
                  {Number(productDraft.originalPrice || 0) >
                    Number(productDraft.price || 0) && (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                      On Sale
                    </span>
                  )}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Selling price
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={productDraft.price}
                      onChange={(event) => updateProductDraft("price", event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Original price / sale compare-at
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={productDraft.originalPrice}
                      onChange={(event) =>
                        updateProductDraft("originalPrice", event.target.value)
                      }
                      placeholder="Leave empty when not on sale"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                    />
                  </label>
                </div>
                {productDraft.originalPrice && (
                  <button
                    type="button"
                    onClick={() => updateProductDraft("originalPrice", "")}
                    className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Remove sale
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-900">Inventory control</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Quantity in stock
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={productDraft.stock}
                      onChange={(event) => {
                        updateProductDraft("stock", event.target.value);
                        if (Number(event.target.value) > 0) {
                          updateProductDraft("inStock", true);
                        }
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Low-stock alert
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={productDraft.lowStockThreshold}
                      onChange={(event) =>
                        updateProductDraft("lowStockThreshold", event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Warehouse
                    </span>
                    <input
                      value={productDraft.warehouseLocation}
                      onChange={(event) =>
                        updateProductDraft("warehouseLocation", event.target.value)
                      }
                      placeholder="Aisle / shelf"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                    />
                  </label>
                </div>
                <label className="mt-4 flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 p-4">
                  <span className="font-semibold text-slate-700">
                    Product is available for purchase
                  </span>
                  <input
                    type="checkbox"
                    checked={productDraft.inStock}
                    onChange={(event) =>
                      updateProductDraft("inStock", event.target.checked)
                    }
                    className="h-4 w-4 accent-[#1572D3]"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Catalog status
                </span>
                <select
                  value={productDraft.status}
                  onChange={(event) => updateProductDraft("status", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>

              <div className="rounded-lg border border-slate-100 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Vehicle compatibility
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Map this part to Make, Model, Year, and Engine Type so
                      customers can find exact-fit parts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addCompatibilityDraft}
                    className="shrink-0 rounded-lg border border-[#1572D3]/20 px-3 py-2 text-xs font-semibold text-[#1572D3] hover:bg-[#E8F1FB]"
                  >
                    Add Fitment
                  </button>
                </div>

                <div className="space-y-4">
                  {(productDraft.compatibilities || []).map((compatibility, index) => {
                    const models = getModelsForBrand(compatibility.brandId);

                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Fitment {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCompatibilityDraft(index)}
                            className="text-xs font-semibold text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-bold uppercase text-slate-400">
                              Make
                            </span>
                            <select
                              value={compatibility.brandId}
                              onChange={(event) =>
                                updateCompatibilityDraft(
                                  index,
                                  "brandId",
                                  event.target.value
                                )
                              }
                              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                            >
                              <option value="">Select make</option>
                              {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                  {brand.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-xs font-bold uppercase text-slate-400">
                              Model
                            </span>
                            <select
                              value={compatibility.modelId}
                              onChange={(event) =>
                                updateCompatibilityDraft(
                                  index,
                                  "modelId",
                                  event.target.value
                                )
                              }
                              disabled={!compatibility.brandId}
                              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1572D3] disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <option value="">
                                {compatibility.brandId
                                  ? "Any model"
                                  : "Select make first"}
                              </option>
                              {models.map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-xs font-bold uppercase text-slate-400">
                              Year from
                            </span>
                            <input
                              type="number"
                              min="1900"
                              max="2100"
                              value={compatibility.yearFrom}
                              onChange={(event) =>
                                updateCompatibilityDraft(
                                  index,
                                  "yearFrom",
                                  event.target.value
                                )
                              }
                              placeholder="2012"
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                            />
                          </label>

                          <label className="block">
                            <span className="text-xs font-bold uppercase text-slate-400">
                              Year to
                            </span>
                            <input
                              type="number"
                              min="1900"
                              max="2100"
                              value={compatibility.yearTo}
                              onChange={(event) =>
                                updateCompatibilityDraft(
                                  index,
                                  "yearTo",
                                  event.target.value
                                )
                              }
                              placeholder="2024"
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                            />
                          </label>

                          <label className="block">
                            <span className="text-xs font-bold uppercase text-slate-400">
                              Engine Type
                            </span>
                            <input
                              value={compatibility.engineType}
                              onChange={(event) =>
                                updateCompatibilityDraft(
                                  index,
                                  "engineType",
                                  event.target.value
                                )
                              }
                              placeholder="1.8L Petrol, 2.0 Diesel..."
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                            />
                          </label>

                          <label className="block">
                            <span className="text-xs font-bold uppercase text-slate-400">
                              Notes
                            </span>
                            <input
                              value={compatibility.notes}
                              onChange={(event) =>
                                updateCompatibilityDraft(
                                  index,
                                  "notes",
                                  event.target.value
                                )
                              }
                              placeholder="Front axle, left side..."
                              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1572D3]"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}

                  {!productDraft.compatibilities?.length && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No vehicle fitment added yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Production note</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  These controls save through the admin catalog API. The next phase
                  can add bulk import for large scraped inventories.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {selectedProduct.id && (
                  <button
                    type="button"
                    onClick={archiveProduct}
                    disabled={savingProduct}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60"
                  >
                    Archive Product
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveProductDraft}
                  disabled={savingProduct}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1572D3] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {savingProduct ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-[140]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setSelectedCustomer(null)}
            aria-label="Close customer details"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1572D3]">
                  Customer Detail
                </p>
                <h3 className="text-xl font-bold text-slate-950">
                  {selectedCustomer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-lg bg-[#F7FBFF] p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Contact
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {selectedCustomer.email}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedCustomer.phone || "Phone not added"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Orders", selectedCustomer.orderCount],
                  ["Spent", formatCurrency(selectedCustomer.totalSpent)],
                  ["Status", selectedCustomer.status],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-100 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
                    <p className="mt-2 font-bold text-[#2B3674]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Latest order
                </p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {selectedCustomer.latestOrder?.orderNumber || "No orders yet"}
                </p>
                <p className="text-sm text-slate-500">
                  {formatDate(selectedCustomer.latestOrder?.createdAt)}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">
                  Demo note
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This drawer is ready for order history, support notes, and account
                  controls when the full customer CRM module is connected.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default AdminPlaceholderPage;
