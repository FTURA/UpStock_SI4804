import { useState, useEffect } from 'react';

const API = 'http://localhost:4000/';

async function gql(query, variables = {}) {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    return await res.json();
  } catch (error) {
    console.error('GraphQL Fetch Error:', error);
    return { errors: [{ message: 'Tidak dapat terhubung ke server backend.' }] };
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('produk');
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    categoryId: '',
    supplierId: ''
  });
  const [alertTambah, setAlertTambah] = useState({ type: '', message: '' });

  const [stockUpdate, setStockUpdate] = useState({
    productId: '',
    quantity: '',
    type: 'IN',
    note: ''
  });
  const [alertStok, setAlertStok] = useState({ type: '', message: '' });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    address: ''
  });
  const [alertSupplier, setAlertSupplier] = useState({ type: '', message: '' });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  const [alertCategory, setAlertCategory] = useState({ type: '', message: '' });

  // Load Data functions
  const loadProducts = async () => {
    const res = await gql(`query {
      getAllProducts { id name price stock category { id name } supplier { id name } }
      getLowStockProducts(threshold: 10) { id }
    }`);
    if (res.data) {
      setProducts(res.data.getAllProducts || []);
      setLowStockProducts(res.data.getLowStockProducts || []);
    }
  };

  const loadSuppliers = async () => {
    const res = await gql(`query {
      getAllSuppliers { id name contact address }
    }`);
    if (res.data) {
      setSuppliers(res.data.getAllSuppliers || []);
    }
  };

  const loadCategories = async () => {
    const res = await gql(`query {
      getAllCategories { id name description }
    }`);
    if (res.data) {
      setCategories(res.data.getAllCategories || []);
    }
  };

  const loadTransactions = async () => {
    const res = await gql(`query {
      getAllTransactions { id type quantity note createdAt product { name } }
    }`);
    if (res.data) {
      setTransactions(res.data.getAllTransactions || []);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadProducts(),
      loadSuppliers(),
      loadCategories(),
      loadTransactions()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Actions
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { name, price, stock, categoryId, supplierId } = newProduct;
    if (!name || !price || stock === '') {
      setAlertTambah({ type: 'error', message: ' Nama, harga, dan stok wajib diisi!' });
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    const res = await gql(`
      mutation($name:String!, $price:Float!, $stock:Int!, $categoryId:ID, $supplierId:ID) {
        addProduct(name:$name, price:$price, stock:$stock, categoryId:$categoryId, supplierId:$supplierId) {
          id name
        }
      }
    `, {
      name,
      price: priceNum,
      stock: stockNum,
      categoryId: categoryId || null,
      supplierId: supplierId || null
    });

    if (res.errors) {
      setAlertTambah({ type: 'error', message: 'Gagal: ' + res.errors[0].message });
    } else {
      setAlertTambah({ type: 'success', message: `Produk "${res.data.addProduct.name}" berhasil ditambahkan!` });
      setNewProduct({ name: '', price: '', stock: '', categoryId: '', supplierId: '' });
      loadProducts();
      loadTransactions(); // adding product creates an initial IN transaction automatically in backend sometimes
    }
    setTimeout(() => setAlertTambah({ type: '', message: '' }), 4000);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    const { productId, quantity, type, note } = stockUpdate;
    if (!productId || !quantity) {
      setAlertStok({ type: 'error', message: 'Produk dan jumlah wajib diisi!' });
      return;
    }

    const qtyNum = parseInt(quantity);

    const res = await gql(`
      mutation($productId:ID!, $quantity:Int!, $type:String!, $note:String) {
        updateStock(productId:$productId, quantity:$quantity, type:$type, note:$note) {
          id name stock
        }
      }
    `, {
      productId,
      quantity: qtyNum,
      type,
      note: note || null
    });

    if (res.errors) {
      setAlertStok({ type: 'error', message: '❌ Gagal: ' + res.errors[0].message });
    } else {
      setAlertStok({ type: 'success', message: `✅ Stok "${res.data.updateStock.name}" berhasil diperbarui menjadi ${res.data.updateStock.stock} unit!` });
      setStockUpdate({ productId: '', quantity: '', type: 'IN', note: '' });
      loadProducts();
      loadTransactions();
    }
    setTimeout(() => setAlertStok({ type: '', message: '' }), 4000);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    const res = await gql(`mutation { deleteProduct(id: "${id}") }`);
    if (res.errors) {
      alert('Gagal menghapus produk: ' + res.errors[0].message);
    } else {
      loadProducts();
      loadTransactions();
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    const { name, contact, address } = newSupplier;
    if (!name) {
      setAlertSupplier({ type: 'error', message: 'Nama supplier wajib diisi!' });
      return;
    }

    const res = await gql(`
      mutation($name:String!, $contact:String, $address:String) {
        addSupplier(name:$name, contact:$contact, address:$address) { id name }
      }
    `, { name, contact, address });

    if (res.errors) {
      setAlertSupplier({ type: 'error', message: 'Gagal: ' + res.errors[0].message });
    } else {
      setAlertSupplier({ type: 'success', message: `Supplier "${res.data.addSupplier.name}" berhasil ditambahkan!` });
      setNewSupplier({ name: '', contact: '', address: '' });
      loadSuppliers();
    }
    setTimeout(() => setAlertSupplier({ type: '', message: '' }), 4000);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const { name, description } = newCategory;
    if (!name) {
      setAlertCategory({ type: 'error', message: 'Nama kategori wajib diisi!' });
      return;
    }

    const res = await gql(`
      mutation($name:String!, $description:String) {
        addCategory(name:$name, description:$description) { id name }
      }
    `, { name, description });

    if (res.errors) {
      setAlertCategory({ type: 'error', message: 'Gagal: ' + res.errors[0].message });
    } else {
      setAlertCategory({ type: 'success', message: `Kategori "${res.data.addCategory.name}" berhasil ditambahkan!` });
      setNewCategory({ name: '', description: '' });
      loadCategories();
    }
    setTimeout(() => setAlertCategory({ type: '', message: '' }), 4000);
  };

  const formatRupiah = (number) => {
    return 'Rp ' + Number(number).toLocaleString('id-ID');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <h1>UpStock</h1>
          <p>Sistem Manajemen Inventori Toko &amp; Integrasi Aplikasi</p>
        </div>
      </header>

      {/* Dashboard Summary Cards */}
      <section className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Produk</h3>
          <p className="value">{products.length}</p>
        </div>
        <div className={`dashboard-card ${lowStockProducts.length > 0 ? 'warn' : ''}`}>
          <h3>Stok Rendah (≤10)</h3>
          <p className="value" style={{ color: lowStockProducts.length > 0 ? 'var(--warning)' : 'inherit' }}>
            {lowStockProducts.length}
          </p>
        </div>
        <div className="dashboard-card accent">
          <h3>Total Supplier</h3>
          <p className="value">{suppliers.length}</p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === 'produk' ? 'active' : ''}`}
          onClick={() => setActiveTab('produk')}
        >
          Produk
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tambahProduk' ? 'active' : ''}`}
          onClick={() => setActiveTab('tambahProduk')}
        >
          Tambah Produk
        </button>
        <button 
          className={`tab-btn ${activeTab === 'updateStok' ? 'active' : ''}`}
          onClick={() => setActiveTab('updateStok')}
        >
          Update Stok
        </button>
        <button 
          className={`tab-btn ${activeTab === 'supplier' ? 'active' : ''}`}
          onClick={() => setActiveTab('supplier')}
        >
          Supplier &amp; Kategori
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transaksi' ? 'active' : ''}`}
          onClick={() => setActiveTab('transaksi')}
        >
          Transaksi
        </button>
      </nav>

      {/* Main Panel Content */}
      <main className="panel-container">
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Memuat data dari server...</p>
          </div>
        ) : (
          <>
            {/* PANEL: Daftar Produk */}
            {activeTab === 'produk' && (
              <div className="table-card">
                <div className="table-header">
                  <h2>Daftar Produk Inventori</h2>
                  <button className="btn btn-primary" onClick={loadAllData} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Refresh
                  </button>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nama Produk</th>
                        <th>Kategori</th>
                        <th>Harga</th>
                        <th>Stok</th>
                        <th>Supplier</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="7">
                            <div className="empty-placeholder">
                              <p>Belum ada produk terdaftar.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td><strong>{p.name}</strong></td>
                            <td>
                              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                {p.category?.name || '-'}
                              </span>
                            </td>
                            <td>{formatRupiah(p.price)}</td>
                            <td>
                              <span className={`badge ${p.stock <= 10 ? 'danger' : 'success'}`}>
                                {p.stock} unit
                              </span>
                            </td>
                            <td>{p.supplier?.name || '-'}</td>
                            <td>
                              <button 
                                className="btn btn-danger-outline"
                                onClick={() => handleDeleteProduct(p.id)}
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PANEL: Tambah Produk */}
            {activeTab === 'tambahProduk' && (
              <div className="form-card">
                <h2>Tambah Produk Baru</h2>
                {alertTambah.message && (
                  <div className="alert-container">
                    <div className={`alert-message ${alertTambah.type}`}>
                      {alertTambah.message}
                    </div>
                  </div>
                )}
                <form onSubmit={handleAddProduct} className="form-grid">
                  <div className="form-group">
                    <label>Nama Produk</label>
                    <input 
                      type="text" 
                      placeholder="cth: Laptop Asus ROG" 
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Harga (Rp)</label>
                    <input 
                      type="number" 
                      placeholder="cth: 15000000" 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stok Awal</label>
                    <input 
                      type="number" 
                      placeholder="cth: 25" 
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select
                      value={newProduct.categoryId}
                      onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    >
                      <option value="">-- Tanpa Kategori --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Supplier</label>
                    <select
                      value={newProduct.supplierId}
                      onChange={(e) => setNewProduct({ ...newProduct, supplierId: e.target.value })}
                    >
                      <option value="">-- Tanpa Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full-width form-actions">
                    <button type="submit" className="btn btn-primary">
                      Simpan Produk
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PANEL: Update Stok */}
            {activeTab === 'updateStok' && (
              <div className="form-card">
                <h2>Update Stok Produk</h2>
                {alertStok.message && (
                  <div className="alert-container">
                    <div className={`alert-message ${alertStok.type}`}>
                      {alertStok.message}
                    </div>
                  </div>
                )}
                <form onSubmit={handleUpdateStock} className="form-grid">
                  <div className="form-group">
                    <label>Pilih Produk</label>
                    <select
                      value={stockUpdate.productId}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, productId: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.id}] {p.name} (Stok: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Jumlah Perubahan</label>
                    <input 
                      type="number" 
                      placeholder="cth: 10" 
                      value={stockUpdate.quantity}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tipe Transaksi</label>
                    <select
                      value={stockUpdate.type}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, type: e.target.value })}
                    >
                      <option value="IN">IN — Barang Masuk (Restock)</option>
                      <option value="OUT">OUT — Barang Keluar (Penjualan)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Catatan (Opsional)</label>
                    <input 
                      type="text" 
                      placeholder="cth: Restock bulanan dari supplier" 
                      value={stockUpdate.note}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, note: e.target.value })}
                    />
                  </div>
                  <div className="form-group full-width form-actions">
                    <button type="submit" className="btn btn-primary">
                     Jalankan Transaksi Stok
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PANEL: Supplier & Kategori */}
            {activeTab === 'supplier' && (
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
                {/* Bagian Supplier */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-card" style={{ margin: 0, maxWidth: 'none' }}>
                    <h2>Tambah Supplier Baru</h2>
                    {alertSupplier.message && (
                      <div className="alert-container">
                        <div className={`alert-message ${alertSupplier.type}`}>
                          {alertSupplier.message}
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label>Nama Supplier</label>
                        <input 
                          type="text" 
                          placeholder="cth: PT Maju Bersama" 
                          value={newSupplier.name}
                          onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Kontak / Telepon</label>
                        <input 
                          type="text" 
                          placeholder="cth: 081234567890" 
                          value={newSupplier.contact}
                          onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Alamat</label>
                        <textarea 
                          placeholder="cth: Jl. Gatot Subroto No. 5, Jakarta" 
                          value={newSupplier.address}
                          onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                          rows="2"
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          Simpan Supplier
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="table-card">
                    <div className="table-header">
                      <h2>Daftar Supplier</h2>
                    </div>
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nama</th>
                            <th>Kontak</th>
                            <th>Alamat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {suppliers.length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                Belum ada supplier.
                              </td>
                            </tr>
                          ) : (
                            suppliers.map((s) => (
                              <tr key={s.id}>
                                <td>{s.id}</td>
                                <td><strong>{s.name}</strong></td>
                                <td>{s.contact || '-'}</td>
                                <td>{s.address || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Bagian Kategori */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-card" style={{ margin: 0, maxWidth: 'none' }}>
                    <h2>Tambah Kategori Baru</h2>
                    {alertCategory.message && (
                      <div className="alert-container">
                        <div className={`alert-message ${alertCategory.type}`}>
                          {alertCategory.message}
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label>Nama Kategori</label>
                        <input 
                          type="text" 
                          placeholder="cth: Elektronik" 
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Deskripsi</label>
                        <textarea 
                          placeholder="cth: Peralatan listrik dan gawai elektronik" 
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          rows="2"
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          💾 Simpan Kategori
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="table-card">
                    <div className="table-header">
                      <h2>Daftar Kategori</h2>
                    </div>
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nama Kategori</th>
                            <th>Deskripsi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.length === 0 ? (
                            <tr>
                              <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                                Belum ada kategori.
                              </td>
                            </tr>
                          ) : (
                            categories.map((c) => (
                              <tr key={c.id}>
                                <td>{c.id}</td>
                                <td><strong>{c.name}</strong></td>
                                <td>{c.description || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL: Transaksi */}
            {activeTab === 'transaksi' && (
              <div className="table-card">
                <div className="table-header">
                  <h2>Riwayat Transaksi Inventori</h2>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>ID Transaksi</th>
                        <th>Produk</th>
                        <th>Tipe</th>
                        <th>Jumlah</th>
                        <th>Catatan</th>
                        <th>Waktu Transaksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan="6">
                            <div className="empty-placeholder">
                              <p>Belum ada transaksi inventori tercatat.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        transactions.map((t) => (
                          <tr key={t.id}>
                            <td>#{t.id}</td>
                            <td><strong>{t.product?.name || '-'}</strong></td>
                            <td>
                              <span className={`badge ${t.type === 'IN' ? 'success' : 'danger'}`}>
                                {t.type}
                              </span>
                            </td>
                            <td>{t.quantity} unit</td>
                            <td>{t.note || '-'}</td>
                            <td>
                              {t.createdAt
                                ? new Date(Number(t.createdAt)).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })
                                : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
