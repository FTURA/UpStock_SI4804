export const typeDefs = `#graphql

  type Category {
    id: ID!
    name: String!
    description: String
  }

  type Supplier {
    id: ID!
    name: String!
    contact: String
    address: String
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    category: Category
    supplier: Supplier
  }

  type Transaction {
    id: ID!
    product: Product!
    type: String!
    quantity: Int!
    note: String
    createdAt: String
  }

  type Query {
    getAllProducts: [Product]
    getProductById(id: ID!): Product
    getLowStockProducts(threshold: Int!): [Product]
    getAllCategories: [Category]
    getAllSuppliers: [Supplier]
    getAllTransactions: [Transaction]
  }

  type Mutation {
    addProduct(name: String!, price: Float!, stock: Int!, categoryId: ID, supplierId: ID): Product
    updateStock(productId: ID!, quantity: Int!, type: String!, note: String): Product
    deleteProduct(id: ID!): Boolean
    addCategory(name: String!, description: String): Category
    addSupplier(name: String!, contact: String, address: String): Supplier
  }
`;